import mongoose, { Types } from 'mongoose';
import UserActivity, { 
  IActivity, 
  ISkill, 
  IGoal, 
  IUserActivity,
  ILearningStats 
} from '../models/userActivity';
import User from '../models/user';
import Interview, { IInterview } from '../models/interview';

// Define the document interface
type IUserActivityDocument = mongoose.Document & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  activities: IActivity[];
  skills: ISkill[];
  goals: IGoal[];
  learningStats: ILearningStats;
  progressHistory: Array<{
    date: Date;
    overallScore: number;
    skillScores: Record<string, number>;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Interface cho populated user
interface IUserPopulated {
  name: string;
  email: string;
}

export class UserActivityService {
  /**
   * Khởi tạo hoạt động tracking cho người dùng mới
   */
  static async initializeUserActivity(userId: string): Promise<IUserActivityDocument> {
    const userActivity = await UserActivity.create({
      userId,
      activities: [],
      skills: [],
      goals: [],
      learningStats: {
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        monthlyStudyTime: 0,
        streak: 0,
        lastStudyDate: new Date()
      }
    });

    // Cập nhật reference trong User model
    await User.findByIdAndUpdate(userId, { userActivityId: userActivity._id });

    return userActivity;
  }

  /**
   * Tracking một hoạt động phỏng vấn mới
   */
  static async trackInterviewActivity(userId: string, interviewId: string): Promise<void> {
    const interview = await Interview.findById(interviewId) as IInterview;
    if (!interview) throw new Error('Interview not found');

    const activity: IActivity = {
      type: 'interview',
      referenceId: new mongoose.Types.ObjectId(interviewId),
      score: interview.evaluation.overallRating,
      duration: Math.max(1, Math.ceil(interview.duration / 60)), // chuyển giây sang phút, làm tròn lên, tối thiểu 1 phút
      timestamp: new Date()
    };

    // Cập nhật UserActivity
    await UserActivity.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $push: { activities: activity },
        $inc: { 'learningStats.totalStudyTime': Math.max(1, Math.ceil(interview.duration / 60)) }
      }
    );

    // Cập nhật streak và ngày học tập
    await this.updateLearningStats(userId);

    // Cập nhật kỹ năng dựa trên kết quả phỏng vấn
    await this.updateSkillsFromInterview(userId, interview);
  }

  /**
   * Cập nhật kỹ năng dựa trên kết quả phỏng vấn
   */
  private static async updateSkillsFromInterview(userId: string, interview: { 
    evaluation: { 
      technicalScore: number;
      communicationScore: number;
      problemSolvingScore: number;
    } 
  }): Promise<void> {
    const skills: Partial<ISkill>[] = [
      {
        name: 'Technical',
        score: interview.evaluation.technicalScore,
        lastAssessed: new Date()
      },
      {
        name: 'Communication',
        score: interview.evaluation.communicationScore,
        lastAssessed: new Date()
      },
      {
        name: 'Problem Solving',
        score: interview.evaluation.problemSolvingScore,
        lastAssessed: new Date()
      }
    ];

    // Cập nhật level dựa trên điểm số
    skills.forEach(skill => {
      if (skill.score) {
        if (skill.score >= 90) skill.level = 'expert';
        else if (skill.score >= 75) skill.level = 'advanced';
        else if (skill.score >= 60) skill.level = 'intermediate';
        else skill.level = 'beginner';
      }
    });

    // Cập nhật hoặc thêm mới các kỹ năng
    for (const skill of skills) {
      // Thử update nếu đã có skill
      const updateResult = await UserActivity.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(userId),
          'skills.name': skill.name
        },
        {
          $set: {
            'skills.$.score': skill.score,
            'skills.$.level': skill.level,
            'skills.$.lastAssessed': skill.lastAssessed
          }
        },
        { upsert: false }
      );
      // Nếu chưa có skill, push mới vào mảng skills
      if (!updateResult) {
        await UserActivity.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(userId) },
          {
            $push: {
              skills: {
                name: skill.name,
                score: skill.score,
                level: skill.level,
                lastAssessed: skill.lastAssessed
              }
            }
          },
          { upsert: true }
        );
      }
    }
  }

  /**
   * Cập nhật streak và thống kê học tập
   */
  static async updateLearningStats(userId: string): Promise<void> {
    const userActivity = await UserActivity.findOne({ userId }) as IUserActivityDocument;
    if (!userActivity) throw new Error('User activity not found');

    const lastStudyDate = new Date(userActivity.learningStats.lastStudyDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

    let streak = userActivity.learningStats.streak;
    if (diffDays === 1) {
      // Người dùng học liên tiếp
      streak += 1;
    } else if (diffDays > 1) {
      // Reset streak nếu bỏ lỡ ngày
      streak = 1;
    }

    await UserActivity.findOneAndUpdate(
      { userId },
      {
        $set: {
          'learningStats.streak': streak,
          'learningStats.lastStudyDate': today
        }
      }
    );
  }

  /**
   * Thêm mục tiêu mới cho người dùng
   */
  static async addGoal(userId: string, goal: IGoal): Promise<IUserActivityDocument | null> {
    return await UserActivity.findOneAndUpdate(
      { userId },
      { $push: { goals: goal } },
      { new: true }
    );
  }

  /**
   * Cập nhật trạng thái mục tiêu
   */
  static async updateGoalStatus(
    userId: string, 
    goalId: string, 
    status: 'pending' | 'in-progress' | 'completed'
  ): Promise<IUserActivityDocument | null> {
    const update: {
      $set: {
        'goals.$.status': string;
        'goals.$.completedDate'?: Date;
      };
    } = {
      $set: {
        'goals.$.status': status
      }
    };

    if (status === 'completed') {
      update.$set['goals.$.completedDate'] = new Date();
    }

    return await UserActivity.findOneAndUpdate(
      { 
        userId,
        'goals._id': goalId 
      },
      update,
      { new: true }
    );
  }

  /**
   * Lấy báo cáo tiến độ của người dùng
   */
  static async getProgressReport(userId: string) {
    const userActivity = await UserActivity.findOne({ userId })
      .populate<{ userId: IUserPopulated }>('userId', 'name email')
      .lean();

    if (!userActivity) throw new Error('User activity not found');

    // Ép kiểu để TypeScript hiểu đúng cấu trúc
    const typedActivity = userActivity as unknown as IUserActivity & {
      userId: IUserPopulated;
    };

    // Tính toán các chỉ số
    const totalInterviews = typedActivity.activities.filter(a => a.type === 'interview').length;
    const averageScore = typedActivity.activities.reduce((sum, act) => sum + (act.score || 0), 0) / 
      typedActivity.activities.length || 0;
    
    const recentActivities = typedActivity.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    const skillProgress = typedActivity.skills.map(skill => ({
      name: skill.name,
      level: skill.level,
      score: skill.score,
      progress: typedActivity.progressHistory
        .filter(ph => skill.name in ph.skillScores)
        .map(ph => ({
          date: ph.date,
          score: ph.skillScores[skill.name]
        }))
    }));

    return {
      user: typedActivity.userId,
      stats: {
        totalInterviews,
        averageScore,
        studyStreak: typedActivity.learningStats.streak,
        totalStudyTime: typedActivity.learningStats.totalStudyTime
      },
      recentActivities,
      skillProgress,
      goals: typedActivity.goals,
      strengths: typedActivity.strengths,
      weaknesses: typedActivity.weaknesses,
      recommendations: typedActivity.recommendations
    };
  }

  /**
   * Tạo recommendations dựa trên hoạt động người dùng
   */
  static async generateRecommendations(userId: string): Promise<string[]> {
    const userActivity = await UserActivity.findOne({ userId }) as IUserActivityDocument;
    if (!userActivity) throw new Error('User activity not found');

    const weakSkills = userActivity.skills
      .filter(skill => skill.score < 70)
      .map(skill => skill.name);

    const recommendations = [];
    
    if (weakSkills.length > 0) {
      recommendations.push(
        `Focus on improving: ${weakSkills.join(', ')}`,
        'Schedule more practice interviews in these areas'
      );
    }

    if (userActivity.learningStats.streak < 3) {
      recommendations.push(
        'Try to maintain a consistent practice schedule',
        'Set daily learning goals to build momentum'
      );
    }

    // Cập nhật recommendations
    await UserActivity.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          recommendations,
          weaknesses: weakSkills 
        }
      }
    );

    return recommendations;
  }

  /**
   * Thêm một hoạt động mới
   */
  static async addActivity(userId: string, activity: IActivity): Promise<void> {
    await UserActivity.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $push: { activities: activity } }
    );
  }

  /**
   * Cập nhật một kỹ năng
   */
  static async updateSkill(userId: string, skillData: Partial<ISkill>): Promise<void> {
    const { name, score, lastAssessed } = skillData;
    
    // Xác định level dựa trên score
    let level: ISkill['level'] = 'beginner';
    if (score) {
      if (score >= 90) level = 'expert';
      else if (score >= 75) level = 'advanced';
      else if (score >= 60) level = 'intermediate';
    }

    await UserActivity.findOneAndUpdate(
      { 
        userId: new Types.ObjectId(userId),
        'skills.name': name 
      },
      {
        $set: {
          'skills.$.score': score,
          'skills.$.level': level,
          'skills.$.lastAssessed': lastAssessed
        }
      },
      { upsert: true }
    );
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
    await this.addActivity(userId, {
      type: 'practice',
      score,
      duration,
      timestamp: new Date()
    });

    // Nếu có điểm số, cập nhật kỹ năng tương ứng
    if (score !== undefined) {
      await this.updateSkill(userId, {
        name: topic,
        score,
        lastAssessed: new Date()
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
    status: 'pending' | 'in-progress' | 'completed'
  ): Promise<void> {
    try {
      // Cập nhật trạng thái mục tiêu
      const update: {
        $set: {
          'goals.$.status': string;
          'goals.$.completedDate'?: Date;
        };
      } = {
        $set: {
          'goals.$.status': status
        }
      };

      // Nếu hoàn thành, thêm thời điểm hoàn thành
      if (status === 'completed') {
        update.$set['goals.$.completedDate'] = new Date();
        
        // Thêm activity cho việc hoàn thành mục tiêu
        await this.addActivity(userId, {
          type: 'goal_completed',
          timestamp: new Date(),
          duration: 0
        });

        // Tạo recommendations mới dựa trên mục tiêu đã hoàn thành
        await this.generateRecommendations(userId);
      }

      // Cập nhật goal trong UserActivity
      await UserActivity.findOneAndUpdate(
        { 
          userId: new Types.ObjectId(userId),
          'goals._id': new Types.ObjectId(goalId)
        },
        update
      );

      // Nếu bắt đầu thực hiện mục tiêu
      if (status === 'in-progress') {
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
  static async getUserActivity(userId: string): Promise<IUserActivityDocument | null> {
    return await UserActivity.findOne({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
  }
}
