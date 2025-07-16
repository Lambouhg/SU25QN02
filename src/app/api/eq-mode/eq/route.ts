import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'eq', positionId, position, duration, selectedCategory, level, history, realTimeScores, totalTime, ...rest } = body;

    // Kiểm tra type hợp lệ
    if (type !== 'test' && type !== 'eq') {
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }

    // Xây dựng data object
    const data: any = {
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

    const assessment = await prisma.assessment.create({
      data,
      include: {
        position: true, // Include position data
      },
    });

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
      ? { userId, type: typeParam as AssessmentType }
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
