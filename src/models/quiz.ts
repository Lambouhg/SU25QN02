import mongoose from 'mongoose';

const userAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  answerIndex: { type: [Number], required: true },
  isCorrect: { type: Boolean, required: true }
});

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: String, required: true },
  topic: { type: String, required: true },
  level: { 
    type: String, 
    enum: ['junior', 'middle', 'senior'],
    required: true 
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  userAnswers: [userAnswerSchema],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeLimit: { type: Number, required: true }, // in minutes
  timeUsed: { type: Number, required: true }, // in seconds
  completedAt: { type: Date, default: Date.now },
  savedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  retryCount: { type: Number, default: 0 } // Track number of retries
});

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);