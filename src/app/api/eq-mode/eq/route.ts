import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import EQ from '@/models/EQ';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await connectDB();
  
  try {
    const body = await request.json();
    const { duration, selectedCategory, level, history, realTimeScores, totalTime } = body;

    // Calculate final scores
    const calculateFinalScores = () => {
      if (history.length === 0) {
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

    const result = await EQ.create({ 
      userId,
      duration,
      selectedCategory,
      level,
      history,
      realTimeScores,
      finalScores,
      totalTime
    });

    return NextResponse.json({ 
      success: true, 
      id: result._id,
      scores: finalScores
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving EQ result:', error);
    return NextResponse.json(
      { error: 'Failed to save EQ result', detail: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await connectDB();
  
  try {
    const results = await EQ.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching EQ results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EQ results', detail: error },
      { status: 500 }
    );
  }
}
