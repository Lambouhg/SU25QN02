import mongoose, { Schema, Document } from 'mongoose';

// Define types for EQ subfields
export interface EQScoreSuggestions {
  emotionalAwareness?: string;
  conflictResolution?: string;
  communication?: string;
}

export interface EQRealTimeScores {
  emotionalAwareness: number;
  conflictResolution: number;
  communication: number;
  suggestions: {
    emotionalAwareness: string;
    conflictResolution: string;
    communication: string;
  };
}

export interface EQFinalScores {
  emotionalAwareness: number;
  conflictResolution: number;
  communication: number;
  overall: number;
}

export interface EQHistoryStage {
  question: string;
  answer: string;
  evaluation: {
    scores: {
      emotionalAwareness: number;
      conflictResolution: number;
      communication: number;
    };
    suggestions: {
      emotionalAwareness: string;
      conflictResolution: string;
      communication: string;
    };
  };
  topic: string;
  timestamp: string;
}

export interface IEQ extends Document {
  userId: string;
  duration: number;
  selectedCategory: string;
  level: string;
  history: EQHistoryStage[];
  realTimeScores: EQRealTimeScores;
  finalScores: EQFinalScores;
  totalTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const EQSchema = new Schema<IEQ>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true
  },
  selectedCategory: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  history: [{
    question: String,
    answer: String,
    evaluation: {
      scores: {
        emotionalAwareness: Number,
        conflictResolution: Number,
        communication: Number
      },
      suggestions: {
        emotionalAwareness: String,
        conflictResolution: String,
        communication: String
      }
    },
    topic: String,
    timestamp: String
  }],
  realTimeScores: {
    emotionalAwareness: Number,
    conflictResolution: Number,
    communication: Number,
    suggestions: {
      emotionalAwareness: String,
      conflictResolution: String,
      communication: String
    }
  },
  finalScores: {
    emotionalAwareness: Number,
    conflictResolution: Number,
    communication: Number,
    overall: Number
  },
  totalTime: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.EQ || mongoose.model<IEQ>('EQ', EQSchema);
