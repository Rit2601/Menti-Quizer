require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const shortid = require('shortid');

const Quiz = require('./models/Quiz');
const Response = require('./models/Response');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error', err));

// Simple health
app.get('/', (req, res) => res.send({ status: 'ok' }));

// Create quiz
app.post('/api/quizzes', async (req, res) => {
  try {
    // Expecting { title, questions: [{ text, type, options? }], expiresAt? }
    const { title, questions, expiresAt } = req.body;
    const quiz = new Quiz({
      quizId: shortid.generate(),
      title,
      questions,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    await quiz.save();
    return res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get quiz (for participant to load questions)
app.get('/api/quizzes/:quizId', async (req, res) => {
  const { quizId } = req.params;
  const quiz = await Quiz.findOne({ quizId }).lean();
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  return res.json(quiz);
});

// Submit an answer
app.post('/api/quizzes/:quizId/answer', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { participantId, answers } = req.body; // answers: [{ qIndex, value }]
    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const response = new Response({
      quizId,
      participantId: participantId || shortid.generate(),
      answers
    });
    await response.save();

    // Emit live update
    const aggregated = await aggregateResults(quizId);
    io.to(quizId).emit('results:update', aggregated);

    return res.status(201).json({ ok: true, participantId: response.participantId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get aggregated results (non realtime)
app.get('/api/quizzes/:quizId/results', async (req, res) => {
  const { quizId } = req.params;
  const aggregated = await aggregateResults(quizId);
  if (!aggregated) return res.status(404).json({ error: 'Quiz not found or no responses' });
  return res.json(aggregated);
});

// Helper to aggregate results
async function aggregateResults(quizId) {
  const quiz = await Quiz.findOne({ quizId }).lean();
  if (!quiz) return null;

  // initialize counters for each question
  const results = quiz.questions.map(q => {
    if (q.type === 'multiple') {
      return { counts: (q.options || []).map(()=>0), total: 0, text: q.text };
    } else if (q.type === 'open') {
      return { texts: [], text: q.text };
    } else { // single choice or others
      return { counts: (q.options || []).map(()=>0), total: 0, text: q.text };
    }
  });

  const responses = await Response.find({ quizId }).lean();
  for (const r of responses) {
    for (const a of r.answers) {
      const qi = a.qIndex;
      if (qi == null || qi <0 || qi >= results.length) continue;
      const q = quiz.questions[qi];
      if (q.type === 'open') {
        results[qi].texts.push({ participantId: r.participantId, value: a.value });
      } else if (q.type === 'multiple') {
        // value is array of indices
        if (Array.isArray(a.value)) {
          for (const idx of a.value) {
            if (typeof idx === 'number' && results[qi].counts[idx] !== undefined) results[qi].counts[idx] += 1;
          }
          results[qi].total += 1;
        } else {
          // fallback for single select stored as number
          if (typeof a.value === 'number' && results[qi].counts[a.value] !== undefined) results[qi].counts[a.value] += 1;
          results[qi].total += 1;
        }
      } else {
        // single select
        const idx = a.value;
        if (typeof idx === 'number' && results[qi].counts[idx] !== undefined) results[qi].counts[idx] += 1;
        results[qi].total += 1;
      }
    }
  }

  return { quizId, title: quiz.title, questions: results, responses: responses.length, rawResponses: undefined };
}

// Socket.IO: join rooms per quizId to receive live updates
io.on('connection', socket => {
  socket.on('join', (quizId) => {
    socket.join(quizId);
  });
  socket.on('leave', (quizId) => {
    socket.leave(quizId);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server listening on', PORT));
