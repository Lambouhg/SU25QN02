import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

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

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    
    if (!adminUser || adminUser.role?.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    let result;

    switch (action) {
      case 'updateSkill':
        // Update user skill using new UserSkillSnapshot model
        result = await prisma.userSkillSnapshot.create({
          data: {
            userId,
            skillName: data.skillName,
            score: data.score,
            source: ActivityType.practice, // Admin manual update
            referenceId: `admin-update-${Date.now()}`
          }
        });

        // Also create an activity event for tracking
        await prisma.userActivityEvent.create({
          data: {
            userId,
            activityType: ActivityType.practice,
            feature: 'skill-management',
            action: 'update_skill',
            score: data.score,
            metadata: {
              skillName: data.skillName,
              level: data.level,
              updatedBy: adminUser.id,
              reason: 'admin-manual-update'
            }
          }
        });
        break;

      case 'addSkillEvent':
        // Add a new skill-related activity event
        result = await prisma.userActivityEvent.create({
          data: {
            userId,
            activityType: data.activityType || ActivityType.practice,
            feature: data.feature || 'skill-training',
            action: data.action || 'skill_gained',
            score: data.score,
            duration: data.duration,
            metadata: {
              skillName: data.skillName,
              source: 'admin-created',
              createdBy: adminUser.id
            },
            skillDeltas: data.skillDeltas || {}
          }
        });

        // Create corresponding skill snapshot
        if (data.skillName && data.score) {
          await prisma.userSkillSnapshot.create({
            data: {
              userId,
              skillName: data.skillName,
              score: data.score,
              source: data.activityType || ActivityType.practice,
              referenceId: result.id
            }
          });
        }
        break;

      case 'updateDailyStats':
        // Update or create daily stats for a specific date
        const targetDate = new Date(data.date);
        targetDate.setHours(0, 0, 0, 0);

        result = await prisma.userDailyStats.upsert({
          where: {
            userId_date: {
              userId,
              date: targetDate
            }
          },
          update: {
            totalActivities: data.totalActivities,
            totalDuration: data.totalDuration,
            avgScore: data.avgScore,
            activityTypeBreakdown: data.activityTypeBreakdown || {},
            skillAverages: data.skillAverages || {}
          },
          create: {
            userId,
            date: targetDate,
            totalActivities: data.totalActivities || 0,
            totalDuration: data.totalDuration || 0,
            avgScore: data.avgScore,
            activityTypeBreakdown: data.activityTypeBreakdown || {},
            skillAverages: data.skillAverages || {}
          }
        });
        break;

      case 'removeActivityEvent':
        // Remove a specific activity event
        result = await prisma.userActivityEvent.delete({
          where: { id: data.eventId }
        });
        break;

      case 'bulkAddEvents':
        // Bulk create multiple activity events
        const bulkEvents = data.events.map((event: {
          activityType: ActivityType;
          feature: string;
          action: string;
          score?: number;
          duration?: number;
          timestamp?: string;
          metadata?: Record<string, unknown>;
          skillDeltas?: Record<string, unknown>;
        }) => ({
          userId,
          activityType: event.activityType,
          feature: event.feature,
          action: event.action,
          score: event.score,
          duration: event.duration,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          metadata: {
            ...event.metadata,
            createdBy: adminUser.id,
            source: 'admin-bulk-import'
          },
          skillDeltas: event.skillDeltas || {}
        }));

        result = await prisma.userActivityEvent.createMany({
          data: bulkEvents
        });
        break;

      case 'resetAllProgress':
        // Delete all user progress data
        await Promise.all([
          prisma.userActivityEvent.deleteMany({ where: { userId } }),
          prisma.userDailyStats.deleteMany({ where: { userId } }),
          prisma.userSkillSnapshot.deleteMany({ where: { userId } })
        ]);

        result = { message: "All user progress data has been reset" };
        break;

      case 'recalculateStats':
        // Recalculate daily stats from activity events
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        
        // Get all events in date range
        const activityEvents = await prisma.userActivityEvent.findMany({
          where: {
            userId,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        // Group by date and calculate stats
        const statsByDate = new Map<string, {
          totalActivities: number;
          totalDuration: number;
          scores: number[];
          activityTypes: Record<string, number>;
          skills: Map<string, number[]>;
        }>();
        
        activityEvents.forEach((event) => {
          const dateKey = event.timestamp.toISOString().split('T')[0];
          if (!statsByDate.has(dateKey)) {
            statsByDate.set(dateKey, {
              totalActivities: 0,
              totalDuration: 0,
              scores: [],
              activityTypes: {},
              skills: new Map()
            });
          }
          
          const dayStats = statsByDate.get(dateKey)!;
          dayStats.totalActivities++;
          dayStats.totalDuration += event.duration || 0;
          if (event.score) dayStats.scores.push(event.score);
          
          dayStats.activityTypes[event.activityType] = (dayStats.activityTypes[event.activityType] || 0) + 1;
        });

        // Update daily stats
        const updatePromises = Array.from(statsByDate.entries()).map(([dateStr, stats]) => {
          const date = new Date(dateStr);
          return prisma.userDailyStats.upsert({
            where: { userId_date: { userId, date } },
            update: {
              totalActivities: stats.totalActivities,
              totalDuration: stats.totalDuration,
              avgScore: stats.scores.length > 0 ? stats.scores.reduce((a: number, b: number) => a + b, 0) / stats.scores.length : null,
              activityTypeBreakdown: stats.activityTypes
            },
            create: {
              userId,
              date,
              totalActivities: stats.totalActivities,
              totalDuration: stats.totalDuration,
              avgScore: stats.scores.length > 0 ? stats.scores.reduce((a: number, b: number) => a + b, 0) / stats.scores.length : null,
              activityTypeBreakdown: stats.activityTypes
            }
          });
        });

        await Promise.all(updatePromises);
        result = { message: `Stats recalculated for ${updatePromises.length} days` };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      message: "User activity updated successfully",
      result
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

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    
    if (!adminUser || adminUser.role?.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Delete all user activity data from new tables
    await Promise.all([
      prisma.userActivityEvent.deleteMany({ where: { userId } }),
      prisma.userDailyStats.deleteMany({ where: { userId } }),
      prisma.userSkillSnapshot.deleteMany({ where: { userId } })
    ]);

    return NextResponse.json({
      message: "All user activity data deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
