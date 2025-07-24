import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Always force type to 'eq' for this endpoint regardless of what was passed
    const { positionId, position, duration, selectedCategory, level, history, realTimeScores, totalTime, ...rest } = body;
    // Explicitly set type to 'eq' for this endpoint
    const type = 'eq';

    // Xây dựng data object
    const data = {
      userId,
      type,
      duration,
      selectedCategory,
      level,
      history,
      realTimeScores,
      totalTime,
      ...rest,
    };

    // Nếu có positionId, sử dụng positionId
    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId }
      });
      if (!positionRecord) {
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
      data.positionId = positionId;
    } else if (position) {
      // Nếu không có positionId nhưng có position string, tìm hoặc tạo position
      let positionRecord = await prisma.position.findFirst({
        where: { positionName: position }
      });
      
      if (!positionRecord) {
        // Tạo position mới nếu chưa có
        positionRecord = await prisma.position.create({
          data: {
            key: position.toLowerCase().replace(/\s+/g, '_'),
            positionName: position,
            level: 'Junior', // Default level
            displayName: position,
            order: 0
          }
        });
      }
      data.positionId = positionRecord.id;
    }

    // Calculate final scores (giữ lại logic cũ)
    const calculateFinalScores = () => {
      if (!history || history.length === 0) {
        return {
          emotionalAwareness: 0,
          conflictResolution: 0,
          communication: 0,
          overall: 0
        };
      }

      interface HistoryStage {
        evaluation?: {
          scores?: {
            emotionalAwareness?: number;
            conflictResolution?: number;
            communication?: number;
          };
        };
      }

      const validStages = history.filter((stage: HistoryStage) => 
        stage.evaluation?.scores && 
        typeof stage.evaluation.scores.emotionalAwareness === 'number' &&
        typeof stage.evaluation.scores.conflictResolution === 'number' &&
        typeof stage.evaluation.scores.communication === 'number'
      );

      if (validStages.length === 0) {
        return {
          emotionalAwareness: 0,
          conflictResolution: 0,
          communication: 0,
          overall: 0
        };
      }

      interface ScoreAccumulator {
        emotionalAwareness: number;
        conflictResolution: number;
        communication: number;
      }

      const totalScores = validStages.reduce((acc: ScoreAccumulator, stage: HistoryStage) => ({
        emotionalAwareness: acc.emotionalAwareness + (stage.evaluation?.scores?.emotionalAwareness || 0),
        conflictResolution: acc.conflictResolution + (stage.evaluation?.scores?.conflictResolution || 0),
        communication: acc.communication + (stage.evaluation?.scores?.communication || 0)
      }), {
        emotionalAwareness: 0,
        conflictResolution: 0,
        communication: 0
      });

      const averageScores = {
        emotionalAwareness: totalScores.emotionalAwareness / validStages.length,
        conflictResolution: totalScores.conflictResolution / validStages.length,
        communication: totalScores.communication / validStages.length
      };

      return {
        ...averageScores,
        overall: (averageScores.emotionalAwareness + averageScores.conflictResolution + averageScores.communication) / 3
      };
    };

    const finalScores = calculateFinalScores();
    data.finalScores = finalScores;

    console.log(`[EQ API] Creating assessment with type: "${type}"`);
    const assessment = await prisma.assessment.create({
      data,
      include: {
        position: true, // Include position data
      },
    });
    console.log(`[EQ API] Created assessment with type: "${assessment.type}"`);

    // Track the EQ assessment completion
    try {
      // Find the database user ID for the Clerk user
      let dbUserId = null;
      try {
        // Look up the user in the database using clerkId
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true }
        });
        
        if (dbUser) {
          dbUserId = dbUser.id;
          console.log(`[EQ API] Found database user ID ${dbUserId} for Clerk user ${userId}`);
        } else {
          console.log(`[EQ API] Could not find database user for Clerk ID ${userId}`);
        }
      } catch (userLookupError) {
        console.error('[EQ API] Error looking up database user:', userLookupError);
      }

      if (dbUserId) {
        const { TrackingIntegrationService } = await import('@/services/trackingIntegrationService');
        await TrackingIntegrationService.trackAssessmentCompletion(dbUserId, assessment, { clerkId: userId });
        console.log(`[EQ API] Successfully tracked EQ assessment completion for user ${dbUserId} (Clerk ID: ${userId})`);
      } else {
        console.warn(`[EQ API] Skipping tracking - could not find database user ID for Clerk user ${userId}`);
      }
    } catch (trackingError) {
      console.error('[EQ API] Error tracking EQ completion:', trackingError);
      // Continue despite error - we don't want to fail the response if tracking fails
    }

    return NextResponse.json({ 
      success: true, 
      id: assessment.id,
      scores: finalScores,
      assessment
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving EQ result:', error);
    return NextResponse.json({ 
      error: 'Failed to save EQ result', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'test' hoặc 'eq'

    // Nếu có type, filter theo type. Nếu không, lấy tất cả
    const where = typeParam && (typeParam === 'test' || typeParam === 'eq')
      ? { userId, type: typeParam as 'test' | 'eq' }
      : { userId };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        position: true, // Include position data
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Giữ lại limit 10 như cũ
    });

    return NextResponse.json({ results: assessments });
  } catch (error) {
    console.error('Error fetching EQ results:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch EQ results', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
