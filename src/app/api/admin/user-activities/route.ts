import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Verify admin permission
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { role: true }
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'lastActive';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query for users
    let userWhere = {};
    if (search) {
      userWhere = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get user activities with pagination
    const [userActivities, totalCount] = await Promise.all([
      prisma.userActivity.findMany({
        where: {
          user: userWhere
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
              status: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: skip,
        take: limit
      }),
      prisma.userActivity.count({
        where: {
          user: userWhere
        }
      })
    ]);

    // Define types for activities, skills, and goals
    type Activity = {
      type: string;
      score?: number;
      timestamp: string;
    };

    type Skill = {
      score: number;
      [key: string]: unknown;
    };

    type Goal = {
      status: string;
      [key: string]: unknown;
    };

    // Calculate summary statistics for each user
    const enrichedActivities = userActivities.map(activity => {
      const activities: Activity[] = Array.isArray(activity.activities) ? activity.activities as Activity[] : [];
      const skills: Skill[] = Array.isArray(activity.skills) ? activity.skills as Skill[] : [];
      const goals: Goal[] = Array.isArray(activity.goals) ? activity.goals as Goal[] : [];
      const learningStats = activity.learningStats as { streak?: number; totalStudyTime?: number } || {};
      
      const totalInterviews = activities.filter((a) => a.type === 'interview').length;
      const totalQuizzes = activities.filter((a) => a.type === 'quiz').length;
      const totalPractice = activities.filter((a) => a.type === 'practice').length;
      
      const averageScore = activities.length > 0 
        ? activities.reduce((sum, act) => sum + (act.score || 0), 0) / activities.length
        : 0;

      const recentActivity = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const topSkills = skills
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const completedGoals = goals.filter((g) => g.status === 'completed').length;
      const activeGoals = goals.filter((g) => g.status === 'in_progress').length;

      return {
        id: activity.id,
        user: activity.user,
        stats: {
          totalInterviews,
          totalQuizzes,
          totalPractice,
          totalActivities: activities.length,
          averageScore: Math.round(averageScore * 100) / 100,
          studyStreak: learningStats.streak || 0,
          totalStudyTime: learningStats.totalStudyTime || 0,
          completedGoals,
          activeGoals
        },
        topSkills,
        recentActivity: recentActivity ? {
          type: recentActivity.type,
          score: recentActivity.score,
          timestamp: recentActivity.timestamp
        } : null,
        lastUpdated: activity.lastActive,
        strengths: Array.isArray(activity.strengths) ? activity.strengths : [],
        weaknesses: Array.isArray(activity.weaknesses) ? activity.weaknesses : []
      };
    });

    // Calculate overall statistics  
    const overallStats = {
      totalUsers: totalCount,
      activeUsers: userActivities.filter(ua => {
        const activities = Array.isArray(ua.activities) ? ua.activities as Activity[] : [];
        return activities.some((a: Activity) => 
          new Date(a.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
      }).length,
      totalInterviews: userActivities.reduce((sum, ua) => {
        const activities = Array.isArray(ua.activities) ? ua.activities as Activity[] : [];
        return sum + activities.filter((a: Activity) => a.type === 'interview').length;
      }, 0),
      averageScore: userActivities.length > 0
        ? userActivities.reduce((sum, ua) => {
            const activities = Array.isArray(ua.activities) ? ua.activities as Activity[] : [];
            const userAvg = activities.length > 0 
              ? activities.reduce((s: number, a: Activity) => s + (a.score || 0), 0) / activities.length
              : 0;
            return sum + userAvg;
          }, 0) / userActivities.length
        : 0
    };

    return NextResponse.json({
      activities: enrichedActivities,
      summary: {
        totalUsers: totalCount,
        activeUsers: overallStats.activeUsers,
        totalActivities: overallStats.totalInterviews,
        averageScore: Math.round(overallStats.averageScore * 100) / 100
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
