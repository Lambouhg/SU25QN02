// models/questionSet.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionSet extends Document {
  userId: string;
  jobTitle: string;
  questionType: 'technical' | 'behavioral';
  level: 'junior' | 'mid' | 'senior';
  questions: string[];
  originalJDText?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSetSchema = new Schema<IQuestionSet>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['technical', 'behavioral'],
    required: true
  },
  level: {
    type: String,
    enum: ['junior', 'mid', 'senior'],  
     required: true
  },
  questions: [{
    type: String,
    required: true
  }],
  originalJDText: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
QuestionSetSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.QuestionSet || mongoose.model<IQuestionSet>('QuestionSet', QuestionSetSchema);
