import { UserActivityService } from './userActivityService';
import  { IInterview } from '../models/interview';
import { Types } from 'mongoose';
interface QuestionWithTopics {
  topics: string[];
}

export class TrackingIntegrationService {
  /**
   * Tracking khi người dùng hoàn thành một buổi phỏng vấn
   */
  static async trackInterviewCompletion(userId: string, interview: IInterview & { _id: Types.ObjectId }) {
    try {
      // Track hoạt động phỏng vấn
      await UserActivityService.trackInterviewActivity(userId, interview._id.toString());

      // Cập nhật streak
      await UserActivityService.updateLearningStats(userId);

      // Tạo recommendations mới
      await UserActivityService.generateRecommendations(userId);
    } catch (error) {
      console.error('Error tracking interview completion:', error);
    }
  }

  /**
   * Tracking khi người dùng làm quiz
   */
  static async trackQuizCompletion(
    userId: string, 
    questions: QuestionWithTopics[], 
    correctAnswers: number,
    timeSpent: number
  ) {
    try {
      const score = (correctAnswers / questions.length) * 100;
      
      // Tạo activity mới
      const activity = {
        type: 'quiz' as const,
        score,
        duration: timeSpent,
        timestamp: new Date()
      };

      // Thêm vào activities
      await UserActivityService.addActivity(userId, activity);

      // Cập nhật kỹ năng dựa trên chủ đề của quiz
      const topics = Array.from(new Set(questions.flatMap(q => q.topics)));
      for (const topic of topics) {
        await UserActivityService.updateSkill(userId, {
          name: topic,
          score: score,
          lastAssessed: new Date()
        });
      }

      // Cập nhật streak
      await UserActivityService.updateLearningStats(userId);
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
    }
  }

  /**
   * Tracking khi người dùng thực hành
   */
  static async trackPracticeSession(
    userId: string,
    topic: string,
    duration: number,
    performanceScore?: number
  ) {
    try {
      // Tạo activity mới
      const activity = {
        type: 'practice' as const,
        score: performanceScore,
        duration,
        timestamp: new Date()
      };

      // Thêm vào activities
      await UserActivityService.addActivity(userId, activity);

      // Cập nhật kỹ năng nếu có performance score
      if (performanceScore) {
        await UserActivityService.updateSkill(userId, {
          name: topic,
          score: performanceScore,
          lastAssessed: new Date()
        });
      }

      // Cập nhật thời gian học tập
      await UserActivityService.updateLearningStats(userId);
    } catch (error) {
      console.error('Error tracking practice session:', error);
    }
  }

  /**
   * Tracking khi người dùng đặt và hoàn thành mục tiêu
   */
  static async trackGoalProgress(
    userId: string,
    goalId: string,
    status: 'pending' | 'in-progress' | 'completed'
  ) {
    try {
      await UserActivityService.updateGoalStatus(userId, goalId, status);
      
      if (status === 'completed') {
        // Tạo recommendations mới sau khi hoàn thành mục tiêu
        await UserActivityService.generateRecommendations(userId);
      }
    } catch (error) {
      console.error('Error tracking goal progress:', error);
    }
  }

  /**
   * Lấy báo cáo tổng quan về tiến độ người dùng
   */
  static async getProgressOverview(userId: string) {
    try {
      // Try to get existing activity
      let userActivity = await UserActivityService.getUserActivity(userId);
      
      // If no activity exists, initialize it
      if (!userActivity) {
        userActivity = await UserActivityService.initializeUserActivity(userId);
      }

      // Return default progress data for new users
      if (!userActivity.activities.length) {
        return {
          stats: {
            totalInterviews: 0,
            averageScore: 0,
            studyStreak: 0,
            totalStudyTime: 0
          },
          skillProgress: [],
          currentFocus: ['Complete your first interview practice'],
          nextMilestones: [
            {
              goal: 'Complete first interview practice',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
          ],
          recommendations: [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ]
        };
      }

      // Get full progress report for existing users
      return await UserActivityService.getProgressReport(userId);
    } catch (error) {
      console.error('Error getting progress overview:', error);
      throw error;
    }
  }
}
