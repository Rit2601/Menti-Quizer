const mongoose = require('mongoose');
const { Schema } = mongoose;

const OptionSchema = new Schema({
  text: String
}, { _id: false });

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['single','multiple','open'], default: 'single' },
  options: [OptionSchema]
}, { _id: false });

const QuizSchema = new Schema({
  quizId: { type: String, unique: true, index: true },
  title: String,
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('Quiz', QuizSchema);
