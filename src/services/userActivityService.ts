import prisma from '@/lib/prisma';
import type { 
  UserActivity as PrismaUserActivity,
  ActivityType,
  SkillLevel,
  GoalStatus,
  Prisma
} from '@prisma/client';

// JSON field types
interface IEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallRating: number;
  recommendations: string[];
}

interface IActivity {
  type: ActivityType;
  referenceId?: string;
  score?: number;
  duration: number;
  timestamp: Date | string;
  skillScores?: Record<string, number>;  // Add skillScores to interface
}

interface ISkill {
  name: string;
  score: number;
  level: SkillLevel;
  category?: string; // Thêm category để lưu trữ thông tin phân loại kỹ năng
  lastAssessed: string; // Changed from Date to string
}

interface IGoal {
  id?: string;
  title: string;
  description?: string;
  targetDate?: string; // Changed from Date to string
  status: GoalStatus;
  type: string;
  completedDate?: string; // Changed from Date to string
}

interface ILearningStats {
  totalStudyTime: number;
  weeklyStudyTime: number;
  monthlyStudyTime: number;
  streak: number;
  lastStudyDate: string;
}

// Helper function to safely parse JSON fields
function parseJsonField<T>(field: Prisma.JsonValue | undefined | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field as T;
  } catch {
    return defaultValue;
  }
}

export class UserActivityService {
  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  private static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  /**
   * Khởi tạo hoạt động tracking cho người dùng mới
   */
  static async initializeUserActivity(userId: string): Promise<PrismaUserActivity | null> {
    try {
      // Check if userId is empty or null
      if (!userId || userId.trim() === '') {
        console.error(`[UserActivityService] Cannot create UserActivity: Invalid userId provided`);
        return null;
      }
      
      // Check if activity already exists before trying to create it
      try {
        const existingActivity = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        if (existingActivity) {
          return existingActivity;
        }
      } catch (findError) {
        console.error(`[UserActivityService] Error checking for existing UserActivity:`, findError);
        // Continue with creation attempt
      }

      // First, verify that the user exists in the database
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (!userExists) {
          console.error(`[UserActivityService] User ${userId} does not exist in database`);
          return null;
        }
      } catch (userCheckError) {
        console.error(`[UserActivityService] Error checking if user exists in database:`, userCheckError);
        // Continue with creation attempt
      }
      
      const initialData = {
        activities: [],
        skills: [],
        goals: [],
        learningStats: {
          totalStudyTime: 0,
          weeklyStudyTime: 0,
          monthlyStudyTime: 0,
          streak: 0,
          lastStudyDate: this.formatDate(new Date())
        }
      };

      // Try to create the user activity with better error handling
      try {
        const userActivity = await prisma.userActivity.create({
          data: {
            userId,
            activities: initialData.activities as Prisma.JsonArray,
            skills: initialData.skills as Prisma.JsonArray,
            goals: initialData.goals as Prisma.JsonArray,
            learningStats: initialData.learningStats as Prisma.JsonObject
          }
        });
        
        return userActivity;
      } catch (createError) {
        // Handle specific error cases
        const error = createError as { name?: string; code?: string };
        if (error?.name === 'PrismaClientKnownRequestError' && error?.code === 'P2003') {
          console.error(`[UserActivityService] Foreign key constraint failed - user ${userId} not found in database`);
        } else {
          console.error(`[UserActivityService] Error creating UserActivity:`, createError);
        }
        return null;
      }
    } catch (error) {
      console.error(`[UserActivityService] Error in initializeUserActivity:`, error);
      return null;
    }
  }

  /**
   * Tracking một hoạt động phỏng vấn mới
   */
  static async trackInterviewActivity(userId: string, interviewId: string): Promise<void> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    
    if (!interview || interview.status !== 'completed') {
      throw new Error('Interview not found or not completed');
    }

    const evaluation = parseJsonField<IEvaluation>(interview.evaluation, {
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      overallRating: 0,
      recommendations: []
    });

    const skillAssessment = parseJsonField<Record<string, number>>(interview.skillAssessment, {});

    // Calculate duration in minutes from seconds
    const durationMinutes = Math.max(1, Math.ceil((interview.duration || 0) / 60));
    const timestamp = this.formatDate(new Date());

    const activity: IActivity = {
      type: 'interview' as ActivityType,
      referenceId: interviewId,
      score: evaluation.overallRating,
      duration: durationMinutes,
      timestamp,
      skillScores: skillAssessment
    };

    // Get current activities and stats
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });

    if (!userActivity) {
      // Create new user activity if not exists
      const skills = this.convertEvaluationToSkills(evaluation, timestamp);
      
      await prisma.userActivity.create({
        data: {
          userId,
          activities: JSON.parse(JSON.stringify([activity])),
          learningStats: {
            totalStudyTime: durationMinutes,
            weeklyStudyTime: durationMinutes,
            monthlyStudyTime: durationMinutes,
            streak: 1,
            lastStudyDate: timestamp
          },
          skills: JSON.parse(JSON.stringify(skills))
        }
      });
      return;
    }

    const currentActivities = parseJsonField<IActivity[]>(userActivity.activities, []);
    const currentStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
      totalStudyTime: 0,
      weeklyStudyTime: 0,
      monthlyStudyTime: 0,
      streak: 0,
      lastStudyDate: timestamp
    });

    // Calculate streak
    const lastStudyDate = new Date(currentStats.lastStudyDate);
    const today = new Date();
    // Set both dates to midnight for comparison
    lastStudyDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = currentStats.streak;
    if (diffDays === 0) {
      // Same day activity, keep streak
      newStreak = Math.max(currentStats.streak, 1);
    } else if (diffDays === 1) {
      // Next day activity, increment streak
      newStreak = currentStats.streak + 1;
    } else {
      // Gap in activity, start new streak
      newStreak = 1;
    }
    
    // Update weekly and monthly study time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const weeklyActivities = currentActivities.filter(a => 
      new Date(a.timestamp) > oneWeekAgo
    );
    const monthlyActivities = currentActivities.filter(a => 
      new Date(a.timestamp) > oneMonthAgo
    );

    const weeklyTime = weeklyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const monthlyTime = monthlyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    
    // Add new activity and update learning stats
    await prisma.userActivity.update({
      where: { userId },
      data: {
        activities: JSON.parse(JSON.stringify([...currentActivities, activity])),
        learningStats: {
          totalStudyTime: currentStats.totalStudyTime + durationMinutes,
          weeklyStudyTime: weeklyTime + durationMinutes,
          monthlyStudyTime: monthlyTime + durationMinutes,
          streak: newStreak,
          lastStudyDate: timestamp
        }
      }
    });

    // Update skills based on evaluation
    await this.updateSkillsFromEvaluation(userId, evaluation, timestamp);
  }

  /**
   * Convert interview evaluation to skills format
   */
  private static convertEvaluationToSkills(evaluation: IEvaluation, timestamp: string): ISkill[] {
    const skills: ISkill[] = [
      {
        name: 'Technical',
        score: evaluation.technicalScore,
        level: this.getSkillLevel(evaluation.technicalScore),
        lastAssessed: timestamp
      },
      {
        name: 'Communication',
        score: evaluation.communicationScore,
        level: this.getSkillLevel(evaluation.communicationScore),
        lastAssessed: timestamp
      },
      {
        name: 'Problem Solving',
        score: evaluation.problemSolvingScore,
        level: this.getSkillLevel(evaluation.problemSolvingScore),
        lastAssessed: timestamp
      }
    ];

    return skills;
  }

  private static getSkillLevel(score: number): SkillLevel {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'intermediate';
    return 'beginner';
  }

  /**
   * Update skills based on interview evaluation
   */
  private static async updateSkillsFromEvaluation(
    userId: string, 
    evaluation: IEvaluation,
    timestamp: string
  ): Promise<void> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });

    if (!userActivity) {
      throw new Error('User activity not found');
    }

    const currentSkills = parseJsonField<ISkill[]>(userActivity.skills, []);
    const newSkills = this.convertEvaluationToSkills(evaluation, timestamp);

    // Update existing skills with new values or add new skills
    const updatedSkills = newSkills.map(newSkill => {
      const existingSkill = currentSkills.find(s => s.name === newSkill.name);
      return existingSkill
        ? { ...existingSkill, ...newSkill }
        : newSkill;
    });

    await prisma.userActivity.update({
      where: { userId },
      data: {
        skills: JSON.parse(JSON.stringify(updatedSkills))
      }
    });
  }

  /**
   * Cập nhật streak và thống kê học tập
   */
  static async updateLearningStats(userId: string): Promise<void> {
    try {
      // Tìm hoặc tạo user activity
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });
      
      // Nếu không tồn tại, tạo mới user activity
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
          // Đã khởi tạo stats trong initializeUserActivity, không cần cập nhật thêm
          return;
        } catch (initError) {
          console.error(`[UserActivityService] Error initializing UserActivity in updateLearningStats:`, initError);
          // Check if it was created by another concurrent process
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in updateLearningStats`);
          }
        }
      }

      const learningStats = userActivity.learningStats as unknown as ILearningStats;
      const lastStudyDate = new Date(learningStats.lastStudyDate);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

      let streak = learningStats.streak;
      if (diffDays === 1) {
        // Người dùng học liên tiếp
        streak += 1;
      } else if (diffDays > 1) {
        // Reset streak nếu bỏ lỡ ngày
        streak = 1;
      }

      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            learningStats: JSON.parse(JSON.stringify({
              ...learningStats,
              streak,
              lastStudyDate: today
            }))
          }
        });
      } catch (updateError) {
        console.error(`[UserActivityService] Error updating learning stats for user ${userId}:`, updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('[UserActivityService] Error in updateLearningStats:', error);
      throw error;
    }
  }

  /**
   * Thêm mục tiêu mới cho người dùng
   */
  static async addGoal(userId: string, goal: IGoal): Promise<PrismaUserActivity> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });

    const currentGoals = parseJsonField<IGoal[]>(userActivity?.goals, []);

    return await prisma.userActivity.update({
      where: { userId },
      data: {
        goals: JSON.parse(JSON.stringify([...currentGoals, goal]))
      }
    });
  }

  /**
   * Cập nhật trạng thái mục tiêu
   */
  static async updateGoalStatus(
    userId: string, 
    goalId: string, 
    status: GoalStatus
  ): Promise<PrismaUserActivity> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });

    const goals = parseJsonField<IGoal[]>(userActivity?.goals, []);
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          status,
          ...(status === 'completed' ? { completedDate: new Date() } : {})
        };
      }
      return g;
    });

    return await prisma.userActivity.update({
      where: { userId },
      data: {
        goals: JSON.parse(JSON.stringify(updatedGoals))
      }
    });
  }

  /**
   * Lấy báo cáo tiến độ của người dùng
   */
  static async getProgressReport(userId: string) {
    try {
      const [userActivity, user] = await Promise.all([
        prisma.userActivity.findUnique({
          where: { userId }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true }
        })
      ]);

      if (!userActivity) {
        await this.initializeUserActivity(userId);
        return {
          user: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            email: user?.email
          },
          stats: {
            totalInterviews: 0,
            averageScore: 0.0,
            studyStreak: 0,
            totalStudyTime: 0
          },
          recentActivities: [],
          skillProgress: [],
          goals: [],
          strengths: [],
          weaknesses: [],
          recommendations: [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ]
        };
      }

      // Parse dữ liệu
      const activities = parseJsonField<IActivity[]>(userActivity.activities, []);
      const learningStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        monthlyStudyTime: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString()
      });
      const skills = parseJsonField<ISkill[]>(userActivity.skills, []);
      const progressHistory = parseJsonField<Array<{
        date: string;
        overallScore: number;
        skillScores: Record<string, number>;
      }>>(userActivity.progressHistory, []);
      const goals = parseJsonField<IGoal[]>(userActivity.goals, []);

    // Tính toán các chỉ số
    const totalInterviews = activities.filter(a => a.type === 'interview').length;
    const averageScore = activities.length > 0
      ? activities.reduce((sum, act) => sum + (act.score || 0), 0) / activities.length
      : 0;
    
    // Sắp xếp activities theo timestamp (ISO string comparison)
    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    const skillProgress = skills.map(skill => ({
      name: skill.name,
      level: skill.level,
      score: skill.score,
      progress: progressHistory
        .filter(ph => skill.name in ph.skillScores)
        .map(ph => ({
          date: ph.date,
          score: ph.skillScores[skill.name]
        }))
    }));

    return {
      user: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email
      },
      stats: {
        totalInterviews,
        averageScore,
        studyStreak: learningStats.streak,
        totalStudyTime: learningStats.totalStudyTime
      },
      recentActivities,
      skillProgress,
      goals,
      strengths: userActivity.strengths as string[] || [],
      weaknesses: userActivity.weaknesses as string[] || [],
      recommendations: userActivity.recommendations as string[] || []
    };
    } catch (error) {
      console.error('Error in getProgressReport:', error);
      return {
        user: {
          name: '',
          email: ''
        },
        stats: {
          totalInterviews: 0,
          averageScore: 0.0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        recentActivities: [],
        skillProgress: [],
        goals: [],
        strengths: [],
        weaknesses: [],
        recommendations: [
          'Start with a practice interview to assess your current level',
          'Set up your learning goals in the dashboard', 
          'Review available learning resources'
        ]
      };
    }
  }

  /**
   * Tạo recommendations dựa trên hoạt động người dùng
   */
  static async generateRecommendations(userId: string): Promise<string[]> {
    try {
      // Tìm hoặc tạo user activity
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });

      // Nếu không tồn tại, tạo mới user activity
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
          return [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ];
        } catch (initError) {
          console.error(`[UserActivityService] Error initializing UserActivity in generateRecommendations:`, initError);
          // Check if it was created by another concurrent process
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in generateRecommendations`);
          }
        }
      }

      const skills = parseJsonField<ISkill[]>(userActivity.skills, []);
      const weakSkills = skills.filter(skill => skill.score < 70).map(skill => skill.name);
      const learningStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        monthlyStudyTime: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString()
      });

      const recommendations = [];
      
      if (weakSkills.length > 0) {
        recommendations.push(
          `Focus on improving: ${weakSkills.join(', ')}`,
          'Schedule more practice interviews in these areas'
        );
      }

      if (learningStats.streak < 3) {
        recommendations.push(
          'Try to maintain a consistent practice schedule',
          'Set daily learning goals to build momentum'
        );
      }

      // Nếu không có recommendations cụ thể, thêm một số mặc định
      if (recommendations.length === 0) {
        recommendations.push(
          'Complete more practice sessions to get personalized recommendations',
          'Try different topics to broaden your skills'
        );
      }

      // Cập nhật recommendations
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            recommendations: JSON.parse(JSON.stringify(recommendations)),
            weaknesses: JSON.parse(JSON.stringify(weakSkills))
          }
        });
      } catch (updateError) {
        console.error(`[UserActivityService] Error updating recommendations for user ${userId}:`, updateError);
        throw updateError;
      }

      return recommendations;
    } catch (error) {
      console.error('[UserActivityService] Error in generateRecommendations:', error);
      return [
        'Start with a practice interview to assess your current level',
        'Set up your learning goals in the dashboard',
        'Review available learning resources'
      ];
    }
  }

  /**
   * Thêm một hoạt động mới
   */
  static async addActivity(userId: string, activity: Omit<IActivity, 'timestamp'> & { timestamp: Date | string }): Promise<void> {
    try {
      // Tính toán điểm tổng thể từ skillScores nếu có
      const updatedActivity = {...activity};
      if (updatedActivity.skillScores && (!updatedActivity.score || updatedActivity.score === 0)) {
        const skillScoreValues = Object.values(updatedActivity.skillScores);
        if (skillScoreValues.length > 0) {
          const totalScore = skillScoreValues.reduce((sum, score) => sum + score, 0);
          const averageScore = Math.round(totalScore / skillScoreValues.length);
          updatedActivity.score = averageScore;
        }
      }
      
      const formattedActivity = {
        ...updatedActivity,
        timestamp: typeof updatedActivity.timestamp === 'string' 
          ? updatedActivity.timestamp 
          : this.formatDate(updatedActivity.timestamp)
      };

      // Tìm user activity
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });

      // Nếu không tồn tại, tạo mới user activity
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
        } catch (initError) {
          console.error(`[UserActivityService] Error initializing UserActivity in addActivity:`, initError);
          // Check if it was created by another concurrent process
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId}`);
          }
        }
        
        // Thêm hoạt động mới vào user activity vừa tạo
        try {
          await prisma.userActivity.update({
            where: { userId },
            data: {
              activities: [formattedActivity] as unknown as Prisma.JsonArray
            }
          });
        } catch (updateError) {
          console.error(`[UserActivityService] Error updating UserActivity with first activity:`, updateError);
          throw updateError;
        }
        return;
      }

      // Nếu đã tồn tại, cập nhật với hoạt động mới
      const currentActivities = parseJsonField<IActivity[]>(userActivity?.activities, []);
      
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            activities: [...currentActivities, formattedActivity] as unknown as Prisma.JsonArray
          }
        });
      } catch (updateError) {
        console.error(`[UserActivityService] Error updating activities for user ${userId}:`, updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('[UserActivityService] Error in addActivity:', error);
      throw error;
    }
  }

  /**
   * Cập nhật một kỹ năng
   */
  static async updateSkill(userId: string, skillData: Partial<ISkill>): Promise<void> {
    try {
      const { name, score, lastAssessed } = skillData;
      
      // Xác định level dựa trên score
      let level: SkillLevel = 'beginner';
      if (score) {
        if (score >= 90) level = 'expert';
        else if (score >= 75) level = 'advanced';
        else if (score >= 60) level = 'intermediate';
      }

      // Tìm hoặc tạo user activity
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });

      // Nếu không tồn tại, tạo mới user activity
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
        } catch (initError) {
          console.error(`[UserActivityService] Error initializing UserActivity in updateSkill:`, initError);
          // Check if it was created by another concurrent process
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in updateSkill`);
          }
        }
      }

      const currentSkills = parseJsonField<ISkill[]>(userActivity?.skills, []);
      const updatedSkills = currentSkills.map(s => 
        s.name === name
          ? { 
              ...s, 
              score: score || s.score, 
              level, 
              lastAssessed: lastAssessed 
                ? typeof lastAssessed === 'string' 
                  ? lastAssessed 
                  : this.formatDate(lastAssessed)
                : this.formatDate(new Date())
            }
          : s
      );

      if (name && !currentSkills.some(s => s.name === name)) {
        updatedSkills.push({
          name,
          score: score || 0,
          level,
          lastAssessed: lastAssessed 
            ? typeof lastAssessed === 'string' 
              ? lastAssessed 
              : this.formatDate(lastAssessed)
            : this.formatDate(new Date())
        });
      }

      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            skills: updatedSkills as unknown as Prisma.JsonArray
          }
        });
      } catch (updateError) {
        console.error(`[UserActivityService] Error updating skills for user ${userId}:`, updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('[UserActivityService] Error in updateSkill:', error);
      throw error;
    }
  }

  /**
   * Track một phiên thực hành
   */
  static async trackPracticeSession(
    userId: string,
    topic: string,
    duration: number,
    score?: number
  ): Promise<void> {
    // Tạo activity mới cho phiên thực hành
    const now = new Date();
    const timestamp = this.formatDate(now);
    
    await this.addActivity(userId, {
      type: 'practice' as ActivityType,
      score,
      duration,
      timestamp
    });

    // Nếu có điểm số, cập nhật kỹ năng tương ứng
    if (score !== undefined) {
      await this.updateSkill(userId, {
        name: topic,
        score,
        lastAssessed: timestamp
      });
    }

    // Cập nhật thống kê học tập
    await this.updateLearningStats(userId);
  }

  /**
   * Track tiến độ của mục tiêu học tập
   */
  static async trackGoalProgress(
    userId: string,
    goalId: string,
    status: GoalStatus
  ): Promise<void> {
    try {
      await this.updateGoalStatus(userId, goalId, status);

      if (status === 'completed') {
        // Thêm activity cho việc hoàn thành mục tiêu
        await this.addActivity(userId, {
          type: 'goal_completed',
          timestamp: new Date(),
          duration: 0
        });

        // Tạo recommendations mới dựa trên mục tiêu đã hoàn thành
        await this.generateRecommendations(userId);
      } else if (status === 'in_progress') {
        await this.addActivity(userId, {
          type: 'goal_started',
          timestamp: new Date(),
          duration: 0
        });
      }

      // Cập nhật thống kê học tập
      await this.updateLearningStats(userId);
    } catch (error) {
      console.error('Error tracking goal progress:', error);
      throw error;
    }
  }

  /**
   * Get user activity data
   */
  static async getUserActivity(userId: string): Promise<PrismaUserActivity | null> {
    return await prisma.userActivity.findUnique({
      where: { userId }
    });
  }
}
