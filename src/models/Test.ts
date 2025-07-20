import { Schema, models, model, Document } from 'mongoose';

// Define types for subfields
export interface ScoreSuggestions {
  fundamental?: string;
  logic?: string;
  language?: string;
}

export interface RealTimeScores {
  fundamental: number;
  logic: number;
  language: number;
  suggestions?: ScoreSuggestions;
}

export interface QAHistory {
  question: string;
  answer: string;
  evaluation: {
    isComplete: boolean;
    score: number;
    strengths: string[];
    weaknesses: string[];
    missingPoints: string[];
    feedback: string;
    suggestedImprovements: string[];
    followUpQuestions: string[];
  };
  topic: string;
  timestamp: string;
}

export interface TestDocument extends Document {
  userId?: string;
  position: string;
  level: string;
  duration: number;
  totalTime?: number;
  history: QAHistory[];
  realTimeScores: RealTimeScores;
  createdAt: Date;
}

const TestSchema = new Schema<TestDocument>({
  userId: { type: String },
  position: { type: String, required: true },
  level: { type: String, required: true },
  duration: { type: Number, required: true },
  totalTime: { type: Number }, // tổng thời gian làm bài (phút)
  history: { type: [Object], required: true },
  realTimeScores: {
    fundamental: { type: Number, required: true },
    logic: { type: Number, required: true },
    language: { type: Number, required: true },
    suggestions: {
      fundamental: { type: String },
      logic: { type: String },
      language: { type: String }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default models.Test || model<TestDocument>('Test', TestSchema);
