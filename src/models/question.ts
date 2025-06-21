import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  content: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [answerSchema],
  fields: [{ type: mongoose.Schema.Types.String, required: true }],
  topics: [{ type: mongoose.Schema.Types.String, required: true }],
  levels: [{
    type: mongoose.Schema.Types.String,
    enum: ['intern', 'fresher', 'middle', 'junior', 'senior'],
    required: true
  }],
  explanation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Question || mongoose.model('Question', questionSchema);