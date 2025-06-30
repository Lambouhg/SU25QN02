import mongoose from 'mongoose';

// Định nghĩa các sub-schemas
const socialLinksSchema = new mongoose.Schema({
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' }
});

const interviewStatsSchema = new mongoose.Schema({
  totalPractices: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  completedInterviews: { type: Number, default: 0 }
});

const experienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  startDate: Date,
  endDate: Date,
  description: String
});

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  startDate: Date,
  endDate: Date
});

const evaluationSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId },
  score: Number,
  feedback: String,
  date: { type: Date, default: Date.now }
});

// Main User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'none'
  },
  aboutMe: {
    type: String,
    default: 'none'
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: 'none'
  },
  department: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  joinDate: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Hoạt động'
  },
  
  experienceLevel: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    default: 'mid'
  },
  preferredInterviewTypes: {
    type: [String],
    default: []
  },
  cvUrl: {
    type: String,
    default: ''
  },
  socialLinks: {
    type: socialLinksSchema,
    default: {}
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  skills: {
    type: [String],
    default: []
  },
  appliedJobs: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  interviewPractices: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  interviewStats: {
    type: interviewStatsSchema,
    default: {}
  },
  experience: {
    type: [experienceSchema],
    default: []
  },
  education: {
    type: [educationSchema],
    default: []
  },
  languages: {
    type: [String],
    default: []
  },
  evaluations: {
    type: [evaluationSchema],
    default: []
  },  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  savedQuestions: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    default: []
  },
  quizHistory: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    default: []
  },
  userActivityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserActivity'
  }
});

// Middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);