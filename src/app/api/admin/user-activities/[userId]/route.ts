import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import UserActivity, { IActivity, ISkill, IGoal, ILearningStats } from "@/models/userActivity";
import Interview from "@/models/interview";

interface UserActivityWithActivities {
  activities: IActivity[];
  skills: ISkill[];
  goals: IGoal[];
  learningStats: ILearningStats;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  updatedAt: Date;
  userId: string;
}

interface InterviewData {
  _id: string;
  questionSetId: string;
  evaluation: unknown;
  duration: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Verify admin permission
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Check if user is admin
    const adminUser = await User.findOne({ clerkId: clerkUser.id });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get user activity with populated data
    const userActivity = await UserActivity.findOne({ userId })
      .populate('userId', 'firstName lastName email avatar role status createdAt')
      .lean() as UserActivityWithActivities | null;

    if (!userActivity) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    // Get detailed interview data
    const interviewActivities = userActivity.activities.filter(a => a.type === 'interview');
    const interviewIds = interviewActivities.map(a => a.referenceId).filter(Boolean);
    
    const interviews = await Interview.find({
      _id: { $in: interviewIds }
    }).select('questionSetId evaluation duration createdAt').lean() as unknown as InterviewData[];

    // Build detailed activities with interview data
    const detailedActivities = await Promise.all(
      userActivity.activities.map(async (activity) => {
        if (activity.type === 'interview' && activity.referenceId) {
          const interview = interviews.find(i => i._id.toString() === activity.referenceId?.toString());
          return {
            ...activity,
            interviewDetails: interview ? {
              questionSetId: interview.questionSetId,
              evaluation: interview.evaluation,
              duration: interview.duration
            } : null
          };
        }
        return activity;
      })
    );

    // Calculate progress over time
    const progressHistory = userActivity.activities
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((activity, index) => {
        const previousActivities = userActivity.activities.slice(0, index + 1);
        const avgScore = previousActivities.reduce((sum, act) => sum + (act.score || 0), 0) / previousActivities.length;
        
        return {
          date: activity.timestamp,
          averageScore: Math.round(avgScore * 100) / 100,
          totalActivities: index + 1,
          cumulativeStudyTime: previousActivities.reduce((sum, act) => sum + act.duration, 0)
        };
      });

    // Skill progress over time
    const skillProgress = userActivity.skills.map(skill => {
      const skillActivities = userActivity.activities
        .filter(a => a.timestamp <= skill.lastAssessed)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        ...skill,
        progressHistory: skillActivities.map((_, index) => ({
          date: skillActivities[index].timestamp,
          score: skill.score // This could be more detailed with historical tracking
        }))
      };
    });

    // Activity breakdown by type and timeframe
    const now = new Date();
    const timeframes = {
      lastWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastMonth: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastThreeMonths: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    const activityBreakdown = Object.entries(timeframes).reduce((acc, [period, startDate]) => {
      const periodActivities = userActivity.activities.filter(a => 
        new Date(a.timestamp) >= startDate
      );

      acc[period] = {
        interview: periodActivities.filter(a => a.type === 'interview').length,
        quiz: periodActivities.filter(a => a.type === 'quiz').length,
        practice: periodActivities.filter(a => a.type === 'practice').length,
        total: periodActivities.length,
        averageScore: periodActivities.length > 0
          ? periodActivities.reduce((sum, a) => sum + (a.score || 0), 0) / periodActivities.length
          : 0
      };

      return acc;
    }, {} as Record<string, {
      interview: number;
      quiz: number;
      practice: number;
      total: number;
      averageScore: number;
    }>);

    // Performance insights
    const insights = {
      strongestSkill: userActivity.skills.length > 0 
        ? userActivity.skills.reduce((max, skill) => skill.score > max.score ? skill : max)
        : null,
      weakestSkill: userActivity.skills.length > 0
        ? userActivity.skills.reduce((min, skill) => skill.score < min.score ? skill : min)
        : null,
      improvementTrend: progressHistory.length >= 2
        ? progressHistory[progressHistory.length - 1].averageScore - progressHistory[0].averageScore
        : 0,
      consistencyScore: userActivity.learningStats.streak,
      goalCompletionRate: userActivity.goals.length > 0
        ? (userActivity.goals.filter(g => g.status === 'completed').length / userActivity.goals.length) * 100
        : 0
    };

    return NextResponse.json({
      user: userActivity.userId,
      activities: detailedActivities,
      skills: skillProgress,
      goals: userActivity.goals,
      learningStats: userActivity.learningStats,
      progressHistory,
      activityBreakdown,
      insights,
      strengths: userActivity.strengths,
      weaknesses: userActivity.weaknesses,
      recommendations: userActivity.recommendations,
      lastUpdated: userActivity.updatedAt
    });

  } catch (error) {
    console.error("Error fetching user activity details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
