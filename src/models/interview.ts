import mongoose, { Schema, Document } from 'mongoose';

// Constant for fixed number of questions
export const FIXED_QUESTIONS = 10;

export interface IMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  interviewField: string;
  interviewLevel: string;
  language: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  conversationHistory: IMessage[];
  evaluation: {
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    cultureFitScore: number;
    overallRating: number;
    technicalStrengths: string[];
    technicalWeaknesses: string[];
    recommendations: string[];
    hiringRecommendation: 'strong_hire' | 'hire' | 'consider' | 'reject';
    detailedFeedback: {
      technical: string;
      softSkills: string;
      experience: string;
      potential: string;
    };
    salary_range?: {
      min: number;
      max: number;
      currency: string;
    };
  };

  questionCount: number;
  coveredTopics: string[];
  skillAssessment: {
    technical: number;
    communication: number;
    problemSolving: number;
  };
  progress: number;
  status: 'completed' | 'interrupted' | 'in-progress';
}

const InterviewSchema = new Schema<IInterview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  interviewField: { type: String, required: true },
  interviewLevel: { type: String, required: true },
  language: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  conversationHistory: [{
    role: { type: String, enum: ['user', 'ai', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
    isError: { type: Boolean }
  }],
  evaluation: {
    technicalScore: { type: Number, min: 1, max: 10 },
    communicationScore: { type: Number, min: 1, max: 10 },
    problemSolvingScore: { type: Number, min: 1, max: 10 },
    cultureFitScore: { type: Number, min: 1, max: 10 },
    overallRating: { type: Number, min: 1, max: 10 },
    technicalStrengths: [String],
    technicalWeaknesses: [String],
    recommendations: [String],
    hiringRecommendation: { 
      type: String, 
      enum: ['strong_hire', 'hire', 'consider', 'reject']
    },
    detailedFeedback: {
      technical: String,
      softSkills: String,
      experience: String,
      potential: String
    },
    salary_range: {
      min: Number,
      max: Number,
      currency: String
    }
  },

  questionCount: { type: Number, default: 0 },
  coveredTopics: [String],
  skillAssessment: {
    technical: { type: Number, min: 0, max: 10, default: 0 },
    communication: { type: Number, min: 0, max: 10, default: 0 },
    problemSolving: { type: Number, min: 0, max: 10, default: 0 }
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status: { 
    type: String, 
    enum: ['completed', 'interrupted', 'in-progress'],
    default: 'in-progress'
  }
});

// Add a pre-save middleware to calculate duration
InterviewSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});

const Interview = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
export default Interview;
