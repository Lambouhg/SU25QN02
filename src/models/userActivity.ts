import mongoose, { Schema, Document } from 'mongoose';

// Interface định nghĩa cấu trúc của một hoạt động
export interface IActivity {
  type: 'interview' | 'quiz' | 'test' | 'eq' | 'practice' | 'learning' | 'goal_completed' | 'goal_started';
  referenceId?: mongoose.Types.ObjectId; // ID của interview/quiz/test liên quan
  score?: number;
  duration: number; // thời gian thực hiện (phút)
  timestamp: Date;
}

// Interface định nghĩa cấu trúc của một kỹ năng
export interface ISkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  lastAssessed: Date;
}

// Interface định nghĩa cấu trúc của một mục tiêu
export interface IGoal {
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'skill' | 'interview' | 'certification';
}

// Interface định nghĩa cấu trúc của thống kê học tập
export interface ILearningStats {
  totalStudyTime: number; // tổng thời gian học tập (phút)
  weeklyStudyTime: number; // thời gian học tập trong tuần
  monthlyStudyTime: number; // thời gian học tập trong tháng
  streak: number; // số ngày học tập liên tiếp
  lastStudyDate: Date;
}

// Interface chính cho UserActivity
export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;
  activities: IActivity[];
  skills: ISkill[];
  goals: IGoal[];
  learningStats: ILearningStats;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastActive: Date;
  progressHistory: {
    date: Date;
    overallScore: number;
    skillScores: Record<string, number>;
  }[];
}

// Schema cho Activity
const ActivitySchema = new Schema<IActivity>({
  type: { type: String, required: true, enum: ['interview', 'quiz', 'test', 'eq', 'practice', 'learning', 'goal_completed', 'goal_started'] },
  referenceId: { type: Schema.Types.ObjectId, required: false },
  score: { type: Number },
  duration: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Schema cho Skill
const SkillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  level: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  score: { type: Number, required: true, min: 0, max: 100 },
  lastAssessed: { type: Date, default: Date.now }
});

// Schema cho Goal
const GoalSchema = new Schema<IGoal>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetDate: { type: Date, required: true },
  completedDate: { type: Date },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['skill', 'interview', 'certification']
  }
});

// Schema cho LearningStats
const LearningStatsSchema = new Schema<ILearningStats>({
  totalStudyTime: { type: Number, default: 0 },
  weeklyStudyTime: { type: Number, default: 0 },
  monthlyStudyTime: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastStudyDate: { type: Date, default: Date.now }
});

// Schema chính cho UserActivity
const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  activities: [ActivitySchema],
  skills: [SkillSchema],
  goals: [GoalSchema],
  learningStats: { type: LearningStatsSchema, default: () => ({}) },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  progressHistory: [{
    date: { type: Date, required: true },
    overallScore: { type: Number, required: true },
    skillScores: { type: Schema.Types.Mixed, required: true } // Store as plain object
  }]
});

// Middleware để tự động cập nhật lastActive
UserActivitySchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Index cho hiệu suất truy vấn
UserActivitySchema.index({ userId: 1 });
UserActivitySchema.index({ 'activities.timestamp': -1 });
UserActivitySchema.index({ 'skills.name': 1 });

export default mongoose.models.UserActivity || 
  mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
