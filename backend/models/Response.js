const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnswerSchema = new Schema({
  qIndex: Number,
  value: Schema.Types.Mixed // numbers, strings, arrays depending on question
}, { _id: false });

const ResponseSchema = new Schema({
  quizId: { type: String, index: true },
  participantId: String,
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Response', ResponseSchema);
