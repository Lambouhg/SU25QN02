import { UserActivityService } from './userActivityService';
import { AssessmentTrackingService } from './assessmentTrackingService';
import type { Interview, GoalStatus, ActivityType, Assessment } from '@prisma/client';

interface QuestionWithTopics {
  topics: string[];
}

interface Activity {
  type: ActivityType;
  score?: number;
  duration: number;
  timestamp: string;  // Changed from Date to string
}

export class TrackingIntegrationService {
  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Tracking khi người dùng hoàn thành một buổi phỏng vấn
   */
  static async trackInterviewCompletion(userId: string, interview: Interview) {
    try {
      // Track hoạt động phỏng vấn
      await UserActivityService.trackInterviewActivity(userId, interview.id);

      // Cập nhật streak
      await UserActivityService.updateLearningStats(userId);

      // Tạo recommendations mới
      await UserActivityService.generateRecommendations(userId);
    } catch (error) {
      console.error('Error tracking interview completion:', error);
    }
  }

  static async trackQuizCompletion(
    userId: string, 
    questions: QuestionWithTopics[], 
    correctAnswers: number,
    timeSpent: number
  ) {
    try {
      const score = (correctAnswers / questions.length) * 100;
      
      // Tạo activity mới
      const activity: Activity = {
        type: 'quiz' as ActivityType,
        score,
        duration: timeSpent,
        timestamp: this.formatDate(new Date())
      };

      // Thêm vào activities
      await UserActivityService.addActivity(userId, activity);

      // Cập nhật kỹ năng dựa trên chủ đề của quiz
      const topics = Array.from(new Set(questions.flatMap(q => q.topics)));
      const timestamp = this.formatDate(new Date());
      for (const topic of topics) {
        await UserActivityService.updateSkill(userId, {
          name: topic,
          score: score,
          lastAssessed: timestamp
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
      const timestamp = this.formatDate(new Date());
      // Tạo activity mới
      const activity: Activity = {
        type: 'practice' as ActivityType,
        score: performanceScore,
        duration,
        timestamp
      };

      // Thêm vào activities
      await UserActivityService.addActivity(userId, activity);

      // Cập nhật kỹ năng nếu có performance score
      if (performanceScore !== undefined) {
        await UserActivityService.updateSkill(userId, {
          name: topic,
          score: performanceScore,
          lastAssessed: timestamp
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
    status: GoalStatus
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

  static async trackAssessmentCompletion(
    userId: string, 
    assessment: Assessment,
    extraData?: { clerkId?: string }
  ) {
    try {
      // Include clerkId in logging if available
      const userIdentifier = extraData?.clerkId 
        ? `${userId} (ClerkID: ${extraData.clerkId})` 
        : userId;
      
      console.log(`[TrackingIntegrationService] Starting assessment completion tracking for user ${userIdentifier}`);
      
      // Check if userId is valid before proceeding
      if (!userId || userId.trim() === '') {
        console.log(`[TrackingIntegrationService] Skipping tracking - invalid userId provided`);
        return;
      }
      
      // Let AssessmentTrackingService handle the tracking
      
      // Sử dụng AssessmentTrackingService để xử lý chi tiết
      await AssessmentTrackingService.trackAssessmentCompletion(userId, assessment);
      console.log(`[TrackingIntegrationService] Successfully tracked assessment completion for user ${userId}`);
    } catch (error) {
      console.error(`[TrackingIntegrationService] Error tracking assessment completion:`, error);
      // Continue execution despite error - we'll log but not rethrow
    }
  }

  static async getProgressOverview(userId: string) {
    try {
      // Try to get existing activity
      let userActivity = await UserActivityService.getUserActivity(userId);
      
      // If no activity exists, initialize it
      if (!userActivity) {
        console.log('No user activity found, initializing new activity for user:', userId);
        userActivity = await UserActivityService.initializeUserActivity(userId);
      }

      // Return default progress data for new users
      if (!userActivity || !userActivity.activities) {
        console.log('No activities found in user activity, returning default data');
        const oneWeekFromNow = this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        return {
          stats: {
            totalInterviews: 0,
            averageScore: 0.0,
            studyStreak: 0,
            totalStudyTime: 0
          },
          skillProgress: [],
          currentFocus: ['Complete your first interview practice'],
          nextMilestones: [
            {
              goal: 'Complete first interview practice',
              targetDate: oneWeekFromNow
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
      console.log('User activity found, generating full progress report for user:', userId);
      const report = await UserActivityService.getProgressReport(userId);
      return report;
    } catch (error) {
      console.error('Error getting progress overview:', error);
      // Return default data instead of throwing error
      const oneWeekFromNow = this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      return {
        stats: {
          totalInterviews: 0,
          averageScore: 0.0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        skillProgress: [],
        currentFocus: ['Complete your first interview practice'],
        nextMilestones: [
          {
            goal: 'Complete first interview practice',
            targetDate: oneWeekFromNow
          }
        ],
        recommendations: [
          'Start with a practice interview to assess your current level',
          'Set up your learning goals in the dashboard',
          'Review available learning resources'
        ]
      };
    }
  }
}
