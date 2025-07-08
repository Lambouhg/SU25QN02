import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import UserActivity, { IActivity, IGoal } from "@/models/userActivity";

export async function GET(request: NextRequest) {
  try {
    // Verify admin permission
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Check if user is admin
    const user = await User.findOne({ clerkId: clerkUser.id });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const days = parseInt(timeframe);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all user activities
    const userActivities = await UserActivity.find({})
      .populate('userId', 'firstName lastName email role createdAt')
      .lean();

    // Overall platform statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = userActivities.filter(ua => 
      ua.activities.some((a: IActivity) => new Date(a.timestamp) >= startDate)
    ).length;

    // Activity statistics
    const allActivities = userActivities.flatMap(ua => ua.activities);
    const recentActivities = allActivities.filter(a => new Date(a.timestamp) >= startDate);

    const activityStats = {
      totalInterviews: allActivities.filter(a => a.type === 'interview').length,
      totalQuizzes: allActivities.filter(a => a.type === 'quiz').length,
      totalPractice: allActivities.filter(a => a.type === 'practice').length,
      recentInterviews: recentActivities.filter(a => a.type === 'interview').length,
      recentQuizzes: recentActivities.filter(a => a.type === 'quiz').length,
      recentPractice: recentActivities.filter(a => a.type === 'practice').length,
      averageScore: allActivities.length > 0
        ? allActivities.reduce((sum, a) => sum + (a.score || 0), 0) / allActivities.length
        : 0
    };

    // User engagement metrics
    const engagementMetrics = {
      dailyActiveUsers: userActivities.filter(ua => 
        ua.activities.some((a: IActivity) => 
          new Date(a.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        )
      ).length,
      weeklyActiveUsers: userActivities.filter(ua => 
        ua.activities.some((a: IActivity) => 
          new Date(a.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )      ).length,
      monthlyActiveUsers: userActivities.filter(ua =>
        ua.activities.some((a: IActivity) =>
          new Date(a.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
      ).length
    };

    // Learning statistics
    const learningStats = {
      totalStudyTime: userActivities.reduce((sum, ua) => sum + ua.learningStats.totalStudyTime, 0),
      averageStreak: userActivities.length > 0
        ? userActivities.reduce((sum, ua) => sum + ua.learningStats.streak, 0) / userActivities.length
        : 0,
      totalGoals: userActivities.reduce((sum, ua) => sum + ua.goals.length, 0),
      completedGoals: userActivities.reduce((sum, ua) => 
        sum + ua.goals.filter((g: IGoal) => g.status === 'completed').length, 0
      )
    };

    // Skill distribution
    const allSkills = userActivities.flatMap(ua => ua.skills);
    const skillDistribution = allSkills.reduce((acc, skill) => {
      if (!acc[skill.name]) {
        acc[skill.name] = {
          count: 0,
          averageScore: 0,
          levels: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
        };
      }
      acc[skill.name].count++;
      acc[skill.name].averageScore += skill.score;
      acc[skill.name].levels[skill.level]++;
      return acc;
    }, {} as Record<string, {
      count: number;
      averageScore: number;
      levels: Record<string, number>;
    }>);

    // Calculate averages for skill distribution
    Object.keys(skillDistribution).forEach(skillName => {
      skillDistribution[skillName].averageScore /= skillDistribution[skillName].count;
    });

    // Convert skillDistribution to array format  
    const skillDistributionArray = Object.entries(skillDistribution).map(([name, data]) => {
      const skillData = data as { 
        count: number; 
        averageScore: number; 
        levels: { 
          beginner: number; 
          intermediate: number; 
          advanced: number; 
          expert: number; 
        }; 
      };
      return {
        name,
        userCount: skillData.count,
        averageScore: Math.round(skillData.averageScore),
        levelDistribution: {
          beginner: skillData.levels.beginner,
          intermediate: skillData.levels.intermediate,
          advanced: skillData.levels.advanced,
          expert: skillData.levels.expert
        }
      };
    }).sort((a, b) => b.userCount - a.userCount);

    // Activity trends (daily for the past timeframe)
    const activityTrends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayActivities = allActivities.filter(a => {
        const activityDate = new Date(a.timestamp);
        return activityDate >= dayStart && activityDate < dayEnd;
      });

      activityTrends.push({
        date: dayStart.toISOString().split('T')[0],
        interviews: dayActivities.filter(a => a.type === 'interview').length,
        quizzes: dayActivities.filter(a => a.type === 'quiz').length,
        practice: dayActivities.filter(a => a.type === 'practice').length,
        total: dayActivities.length,
        averageScore: dayActivities.length > 0
          ? dayActivities.reduce((sum, a) => sum + (a.score || 0), 0) / dayActivities.length
          : 0
      });
    }

    // Top performers
    const topPerformers = userActivities
      .map(ua => {
        const avgScore = ua.activities.length > 0
          ? ua.activities.reduce((sum: number, a: IActivity) => sum + (a.score || 0), 0) / ua.activities.length
          : 0;
        
        return {
          user: ua.userId,
          averageScore: avgScore,
          totalActivities: ua.activities.length,
          studyStreak: ua.learningStats.streak,
          totalStudyTime: ua.learningStats.totalStudyTime
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    // Most active users
    const mostActiveUsers = userActivities
      .map(ua => ({
        user: ua.userId,
        totalActivities: ua.activities.length,
        recentActivities: ua.activities.filter((a: IActivity) => new Date(a.timestamp) >= startDate).length,
        studyStreak: ua.learningStats.streak
      }))
      .sort((a, b) => b.totalActivities - a.totalActivities)
      .slice(0, 10);

    // Goal completion insights
    const goalInsights = {
      totalGoalsSet: learningStats.totalGoals,
      goalsCompleted: learningStats.completedGoals,
      completionRate: learningStats.totalGoals > 0 
        ? (learningStats.completedGoals / learningStats.totalGoals) * 100 
        : 0,
      averageGoalsPerUser: userActivities.length > 0 
        ? learningStats.totalGoals / userActivities.length 
        : 0
    };

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        userGrowthRate: 0, // Could be calculated with historical data
        platformEngagement: (activeUsers / totalUsers) * 100
      },
      activityStats,
      engagementMetrics,
      learningStats,
      skillDistribution: skillDistributionArray,
      activityTrends,
      topPerformers,
      mostActiveUsers,
      goalInsights,
      timeframe: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching user activity analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
