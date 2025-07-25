import { UserActivityService } from './userActivityService';
import { Assessment, ActivityType } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Service chuyên về tracking hoạt động assessment (test và EQ)
 */
export class AssessmentTrackingService {
  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Tracking khi người dùng hoàn thành một bài test hoặc EQ
   */
  static async trackAssessmentCompletion(userId: string, assessment: Assessment, extraData?: { clerkId?: string }) {
    try {
      const userIdentifier = extraData?.clerkId ? `${userId} (ClerkID: ${extraData.clerkId})` : userId;
      console.log(`[AssessmentTrackingService] Tracking ${assessment.type} completion for user ${userIdentifier}`);
      
      // Define a timeout promise to prevent hanging on database operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database operation timed out")), 5000);
      });
      
      // First check if the user exists in the User table (with timeout)
      let userExists = null;
      try {
        userExists = await Promise.race([
          prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
          }),
          timeoutPromise
        ]);
      } catch (dbError) {
        console.error(`[AssessmentTrackingService] Error checking if user exists:`, dbError);
      }
      
      if (!userExists) {
        console.warn(`[AssessmentTrackingService] User ${userIdentifier} not found in database or database error occurred`);
        
        if (extraData?.clerkId) {
          // Try to look up by clerkId instead
          try {
            const userByClerkId = await Promise.race([
              prisma.user.findUnique({
                where: { clerkId: extraData.clerkId },
                select: { id: true }
              }),
              timeoutPromise
            ]) as { id: string } | null;
            
            if (userByClerkId) {
              console.log(`[AssessmentTrackingService] Found user via clerkId instead: ${userByClerkId.id}`);
              userId = userByClerkId.id; // Update userId to the correct database ID
              userExists = userByClerkId;
            }
          } catch (clerkLookupError) {
            console.error(`[AssessmentTrackingService] Error looking up user by clerkId:`, clerkLookupError);
          }
        }
        
        // If we still don't have a valid user, log activity in memory only and return
        if (!userExists) {
          console.log(`[AssessmentTrackingService] Creating in-memory tracking only for user ${userIdentifier}`);
          // Just log the activity for now since we can't save it to the database
          console.log(`[AssessmentTrackingService] IN-MEMORY TRACKING: ${assessment.type} completed by user ${userIdentifier} with score ${this.extractScore(assessment)}`);
          
          return;
        }
      }
      
      // Check if UserActivity exists, if not, initialize it
      let userActivity = null;
      try {
        userActivity = await Promise.race([
          prisma.userActivity.findUnique({ where: { userId } }),
          timeoutPromise
        ]);
      } catch (findError) {
        console.error(`[AssessmentTrackingService] Error finding UserActivity:`, findError);
      }
      
      if (!userActivity) {
        console.log(`[AssessmentTrackingService] Creating new UserActivity for user ${userIdentifier}`);
        try {
          userActivity = await UserActivityService.initializeUserActivity(userId);
          
          if (!userActivity) {
            console.warn(`[AssessmentTrackingService] Failed to create UserActivity record - will continue without it`);
          } else {
            console.log(`[AssessmentTrackingService] Successfully created new UserActivity for user ${userIdentifier}`);
          }
        } catch (initError) {
          console.error(`[AssessmentTrackingService] Error initializing UserActivity:`, initError);
        }
      }
      
      // Tạo activity mới dựa trên loại assessment
      // Đảm bảo type được chuyển đổi chính xác từ AssessmentType sang ActivityType
      console.log(`[AssessmentTrackingService] Assessment type received: "${assessment.type}", converting to ActivityType`);
      
      // Map assessment type to activity type
      // Ensure 'eq' type is preserved as ActivityType
      const activityType = assessment.type as ActivityType;
      console.log(`[AssessmentTrackingService] Using activity type: "${activityType}"`);
      
      // Create the activity object with proper typing
      const activity = {
        type: activityType,  // Explicitly typed as ActivityType
        score: this.extractScore(assessment),
        duration: assessment.duration || 0, // Đảm bảo duration không null
        timestamp: this.formatDate(new Date()),
        referenceId: assessment.id, // Thêm ID tham chiếu đến assessment
        skillScores: this.extractSkillScores(assessment) // Thêm điểm kỹ năng chi tiết
      };
      
      console.log(`[AssessmentTrackingService] Created activity with type: "${activity.type}"`);
      

      // Thêm vào activities - with extra error handling
      try {
        await UserActivityService.addActivity(userId, activity);
        console.log(`[AssessmentTrackingService] Successfully added activity for user ${userId}`);
      } catch (activityError) {
        console.error(`[AssessmentTrackingService] Error adding activity:`, activityError);
        // Continue despite error
      }

      // Cập nhật kỹ năng dựa trên bài assessment
      try {
        await this.updateSkillsFromAssessment(userId, assessment);
        console.log(`[AssessmentTrackingService] Successfully updated skills for user ${userId}`);
      } catch (skillError) {
        console.error(`[AssessmentTrackingService] Error updating skills:`, skillError);
        // Tiếp tục mặc dù có lỗi
      }

      // Cập nhật streak
      try {
        await UserActivityService.updateLearningStats(userId);
        console.log(`[AssessmentTrackingService] Successfully updated learning stats for user ${userId}`);
      } catch (statsError) {
        console.error(`[AssessmentTrackingService] Error updating learning stats:`, statsError);
        // Tiếp tục mặc dù có lỗi
      }

      // Tạo recommendations mới
      try {
        await UserActivityService.generateRecommendations(userId);
        console.log(`[AssessmentTrackingService] Successfully generated recommendations for user ${userId}`);
      } catch (recError) {
        console.error(`[AssessmentTrackingService] Error generating recommendations:`, recError);
        // Tiếp tục mặc dù có lỗi
      }
      
      console.log(`[AssessmentTrackingService] Successfully tracked ${assessment.type} completion for user ${userId}`);
    } catch (error) {
      console.error(`[AssessmentTrackingService] Error tracking ${assessment.type} completion:`, error);
      throw error; // Rethrow to help with debugging
    }
  }

  /**
   * Trích xuất điểm số từ bài assessment
   */
  private static extractScore(assessment: Assessment): number {
    try {
      if (assessment.type === 'test') {
        // Điểm từ bài test thường là finalScores hoặc realTimeScores
        const realTimeScores = assessment.realTimeScores as Record<string, number>;
        if (realTimeScores && 'finalScore' in realTimeScores) {
          return realTimeScores.finalScore;
        }
        return 0;
      } else if (assessment.type === 'eq') {
        // Điểm từ bài EQ thường là trung bình của các điểm thành phần
        const finalScores = assessment.finalScores as Record<string, number>;
        if (!finalScores) return 0;
        
        const scores = Object.values(finalScores);
        if (scores.length === 0) return 0;
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return sum / scores.length;
      }
      return 0;
    } catch (error) {
      console.error('Error extracting score:', error);
      return 0;
    }
  }
  
  /**
   * Trích xuất điểm chi tiết theo kỹ năng từ bài assessment
   */
  private static extractSkillScores(assessment: Assessment): Record<string, number> | undefined {
    try {
      if (assessment.type === 'test') {
        // Trích xuất điểm kỹ năng từ bài test
        const realTimeScores = assessment.realTimeScores as Record<string, number>;
        if (!realTimeScores) return undefined;
        
        // Loại bỏ các trường không phải điểm kỹ năng (như finalScore, totalCorrect, etc)
        const skillScores: Record<string, number> = {};
        const excludedFields = ['finalScore', 'totalCorrect', 'totalQuestions', 'timeSpent'];
        
        for (const [key, value] of Object.entries(realTimeScores)) {
          if (!excludedFields.includes(key) && typeof value === 'number') {
            skillScores[key] = value;
          }
        }
        
        // Nếu không có điểm kỹ năng cụ thể, lưu điểm tổng vào "overall"
        if (Object.keys(skillScores).length === 0 && 'finalScore' in realTimeScores) {
          skillScores.overall = realTimeScores.finalScore;
        }
        
        return Object.keys(skillScores).length > 0 ? skillScores : undefined;
      } 
      else if (assessment.type === 'eq') {
        // Trích xuất điểm kỹ năng từ bài EQ
        const finalScores = assessment.finalScores as Record<string, number>;
        if (!finalScores) return undefined;
        
        return {
          emotionalAwareness: finalScores.emotionalAwareness || 0,
          conflictResolution: finalScores.conflictResolution || 0,
          communication: finalScores.communication || 0,
          overall: finalScores.overall || 0
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error extracting skill scores:', error);
      return undefined;
    }
  }

  /**
   * Cập nhật kỹ năng dựa trên bài assessment
   */
  private static async updateSkillsFromAssessment(userId: string, assessment: Assessment) {
    try {
      const timestamp = this.formatDate(new Date());
      
      if (assessment.type === 'test') {
        // Lấy kỹ năng từ position và topic
        let skillName = 'Technical Test';
        let skillCategory = '';
        
        if (assessment.positionId) {
          // Tìm position từ positionId
          const position = await prisma.position.findUnique({
            where: { id: assessment.positionId }
          });
          if (position) {
            skillName = position.positionName;
            skillCategory = position.level; // Sử dụng level từ position
          }
        }
        
        // Sử dụng topic từ metadata nếu có
        const metadata = assessment.realTimeScores as Record<string, unknown> || {};
        const topic = metadata.topic as string | undefined;
        if (topic) {
          skillName = `${skillName}: ${topic}`; // Kết hợp position và topic
        }
        
        // Điểm từ bài test
        const score = this.extractScore(assessment);
        
        // Cập nhật kỹ năng
        await UserActivityService.updateSkill(userId, {
          name: skillName,
          score,
          category: skillCategory, // Thêm category dựa trên level của position
          lastAssessed: timestamp
        });
      } else if (assessment.type === 'eq') {
        // Điểm EQ
        const score = this.extractScore(assessment);
        const category = assessment.selectedCategory || 'Emotional Intelligence';
        
        // Cập nhật kỹ năng EQ
        await UserActivityService.updateSkill(userId, {
          name: category,
          score,
          lastAssessed: timestamp
        });
      }
    } catch (error) {
      console.error('Error updating skills from assessment:', error);
    }
  }
}
