import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import UserActivity, { IActivity, ISkill, IGoal } from "@/models/userActivity";

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {};
    if (search) {
      const searchUsers = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = searchUsers.map(u => u._id);
      searchQuery = { userId: { $in: userIds } };
    }

    // Get user activities with pagination
    const [userActivities, totalCount] = await Promise.all([
      UserActivity.find(searchQuery)
        .populate('userId', 'firstName lastName email avatar role status')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserActivity.countDocuments(searchQuery)
    ]);

    // Calculate summary statistics for each user
    const enrichedActivities = userActivities.map(activity => {
      const totalInterviews = activity.activities.filter((a: IActivity) => a.type === 'interview').length;
      const totalQuizzes = activity.activities.filter((a: IActivity) => a.type === 'quiz').length;
      const totalPractice = activity.activities.filter((a: IActivity) => a.type === 'practice').length;
      
      const averageScore = activity.activities.length > 0 
        ? activity.activities.reduce((sum: number, act: IActivity) => sum + (act.score || 0), 0) / activity.activities.length
        : 0;

      const recentActivity = activity.activities
        .sort((a: IActivity, b: IActivity) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const topSkills = activity.skills
        .sort((a: ISkill, b: ISkill) => b.score - a.score)
        .slice(0, 3);

      const completedGoals = activity.goals.filter((g: IGoal) => g.status === 'completed').length;
      const activeGoals = activity.goals.filter((g: IGoal) => g.status === 'in-progress').length;

      return {
        _id: activity._id,
        user: activity.userId,
        stats: {
          totalInterviews,
          totalQuizzes,
          totalPractice,
          totalActivities: activity.activities.length,
          averageScore: Math.round(averageScore * 100) / 100,
          studyStreak: activity.learningStats.streak,
          totalStudyTime: activity.learningStats.totalStudyTime,
          completedGoals,
          activeGoals
        },
        topSkills,
        recentActivity: recentActivity ? {
          type: recentActivity.type,
          score: recentActivity.score,
          timestamp: recentActivity.timestamp
        } : null,
        lastUpdated: activity.updatedAt,
        strengths: activity.strengths,
        weaknesses: activity.weaknesses
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalUsers: totalCount,
      activeUsers: userActivities.filter(ua => 
        ua.activities.some((a: IActivity) => 
          new Date(a.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        )
      ).length,
      totalInterviews: userActivities.reduce((sum, ua) => 
        sum + ua.activities.filter((a: IActivity) => a.type === 'interview').length, 0
      ),
      averageScore: userActivities.length > 0
        ? userActivities.reduce((sum, ua) => {
            const userAvg = ua.activities.length > 0 
              ? ua.activities.reduce((s: number, a: IActivity) => s + (a.score || 0), 0) / ua.activities.length
              : 0;
            return sum + userAvg;
          }, 0) / userActivities.length
        : 0
    };

    return NextResponse.json({
      userActivities: enrichedActivities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      overallStats
    });

  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
