import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'test', positionId, position, topic, history, ...rest } = body;

    // Kiểm tra type hợp lệ
    if (type !== 'test' && type !== 'eq') {
      const ms = Date.now() - start;
      console.log(`POST /api/assessment 400 in ${ms}ms`);
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }

    // Tìm database user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Kiểm tra hạn mức sử dụng trước khi tạo assessment
    const activeUserPackage = await prisma.userPackage.findFirst({
      where: {
        userId: dbUser.id,
        isActive: true,
        endDate: { gte: new Date() }
      },
      include: { servicePackage: true }
    });

    if (!activeUserPackage) {
      return NextResponse.json({ 
        error: 'No active service package found. Please purchase a package to continue.' 
      }, { status: 403 });
    }

    // Kiểm tra hạn mức testQuizEQ
    const used = activeUserPackage.testQuizEQUsed;
    const limit = activeUserPackage.servicePackage.testQuizEQLimit;
    
    if (used >= limit) {
      return NextResponse.json({ 
        error: `Test/EQ usage exceeded: ${used}/${limit}. Please upgrade your package.` 
      }, { status: 403 });
    }

    // Xây dựng data object
    const data = {
      userId,
      type: type as AssessmentType,
      ...rest,
    };

    // Xử lý topic cho test mode - lưu vào realTimeScores
    if (type === 'test' && topic) {
      if (data.realTimeScores) {
        data.realTimeScores = {
          ...JSON.parse(JSON.stringify(data.realTimeScores)),
          topic
        };
      } else {
        data.realTimeScores = { topic };
      }
    }

    // Xử lý position - ưu tiên positionId, sau đó position string
    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId }
      });
      if (!positionRecord) {
        const ms = Date.now() - start;
        console.log(`POST /api/assessment 400 in ${ms}ms`);
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
      data.positionId = positionId;
    } else if (position) {
      // Tìm hoặc tạo position mới
      let positionRecord = await prisma.position.findFirst({
        where: { positionName: position }
      });
      
      if (!positionRecord) {
        positionRecord = await prisma.position.create({
          data: {
            key: position.toLowerCase().replace(/\s+/g, '_'),
            positionName: position,
            level: 'Junior',
            displayName: position,
            order: 0
          }
        });
      }
      data.positionId = positionRecord.id;
    }

    // Tính toán finalScores cho EQ mode
    if (type === 'eq' && history) {
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

      data.finalScores = calculateFinalScores();
    }

    console.log(`[Assessment API] Creating assessment with type: "${type}"`);
    const assessment = await prisma.assessment.create({
      data,
      include: {
        position: true,
      },
    });
    // Track assessment completion với database user ID
    try {
      await TrackingIntegrationService.trackAssessmentCompletion(dbUser.id, assessment, { clerkId: userId });
      console.log(`[Assessment API] Successfully tracked ${type} assessment completion for user ${dbUser.id} (Clerk ID: ${userId})`);
    } catch (trackingError) {
      console.error(`[Assessment API] Error tracking ${type} completion:`, trackingError);
      // Continue despite error
    }

    // Prepare response based on type
    if (type === 'eq') {
      return NextResponse.json({ 
        success: true, 
        id: assessment.id,
        scores: data.finalScores,
        assessment
      }, { status: 201 });
    } else {
      // For test mode, include both Clerk and DB user IDs
      const responseData = {
        ...assessment,
        userId,
        clerkId: userId,
        dbUserId: dbUser.id
      };
      return NextResponse.json(responseData, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ 
      error: 'Lưu kết quả thất bại', 
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
    const limitParam = searchParams.get('limit');

    // Nếu có type, filter theo type. Nếu không, lấy tất cả
    const where = {
      userId,
      ...(typeParam === 'test' || typeParam === 'eq' ? { type: typeParam as AssessmentType } : {})
    };

    interface QueryOptions {
      where: {
        userId: string;
        type?: AssessmentType;
      };
      include: {
        position: boolean;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take?: number;
    }

    const queryOptions: QueryOptions = {
      where,
      include: {
        position: true, // Include position data
      },
      orderBy: { createdAt: 'desc' },
    };

    // Apply limit if specified (for EQ mode compatibility)
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        queryOptions.take = limit;
      }
    }

    const assessments = await prisma.assessment.findMany(queryOptions);

    // Return different formats based on type for backward compatibility
    if (typeParam === 'eq') {
      return NextResponse.json({ results: assessments });
    } else {
      return NextResponse.json(assessments);
    }
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
