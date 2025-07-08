import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import UserActivity from "@/models/userActivity";

export async function PATCH(
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

    const body = await request.json();
    const { action, data } = body;

    let result;

    switch (action) {
      case 'updateGoal':
        result = await UserActivity.findOneAndUpdate(
          { 
            userId,
            'goals._id': data.goalId 
          },
          {
            $set: {
              'goals.$.status': data.status,
              'goals.$.targetDate': data.targetDate,
              'goals.$.description': data.description,
              ...(data.status === 'completed' && { 'goals.$.completedDate': new Date() })
            }
          },
          { new: true }
        );
        break;

      case 'addGoal':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $push: {
              goals: {
                ...data,
                createdDate: new Date(),
                status: 'pending'
              }
            }
          },
          { new: true }
        );
        break;

      case 'removeGoal':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $pull: {
              goals: { _id: data.goalId }
            }
          },
          { new: true }
        );
        break;

      case 'updateSkill':
        result = await UserActivity.findOneAndUpdate(
          {
            userId,
            'skills.name': data.skillName
          },
          {
            $set: {
              'skills.$.score': data.score,
              'skills.$.level': data.level,
              'skills.$.lastAssessed': new Date()
            }
          },
          { new: true }
        );
        break;

      case 'addRecommendation':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $push: {
              recommendations: data.recommendation
            }
          },
          { new: true }
        );
        break;

      case 'removeRecommendation':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $pull: {
              recommendations: data.recommendation
            }
          },
          { new: true }
        );
        break;

      case 'updateLearningStats':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $set: {
              'learningStats.streak': data.streak,
              'learningStats.totalStudyTime': data.totalStudyTime
            }
          },
          { new: true }
        );
        break;

      case 'resetProgress':
        result = await UserActivity.findOneAndUpdate(
          { userId },
          {
            $set: {
              activities: [],
              skills: [],
              'learningStats.streak': 0,
              'learningStats.totalStudyTime': 0,
              'learningStats.weeklyStudyTime': 0,
              'learningStats.monthlyStudyTime': 0,
              progressHistory: [],
              strengths: [],
              weaknesses: [],
              recommendations: []
            }
          },
          { new: true }
        );
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User activity updated successfully",
      userActivity: result
    });

  } catch (error) {
    console.error("Error updating user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete user activity
    const result = await UserActivity.findOneAndDelete({ userId });

    if (!result) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    // Update user reference
    await User.findByIdAndUpdate(userId, { $unset: { userActivityId: 1 } });

    return NextResponse.json({
      message: "User activity deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
