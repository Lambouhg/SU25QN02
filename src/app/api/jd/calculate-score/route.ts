import { NextRequest, NextResponse } from 'next/server';
import { JdAnswerService } from '@/services/jdService/jdAnswerService';
import { getAuth } from '@clerk/nextjs/server';

/**
 * Calculate overall score from detailed scores using backend formula
 */
function calculateOverallScore(detailedScores: Record<string, number>): number {
  // Simple average calculation - no weights needed
  const scores = Object.values(detailedScores);
  
  if (scores.length === 0) {
    return 0;
  }

  // Calculate simple average
  const sum = scores.reduce((total, score) => total + score, 0);
  const average = sum / scores.length;

  // Return average, rounded to 2 decimal places
  return Math.round(average * 100) / 100;
}

/**
 * Update existing JD answer with calculated overall score
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answerId, detailedScores } = await req.json();

    if (!answerId || !detailedScores) {
      return NextResponse.json(
        { error: 'Answer ID and detailed scores are required' },
        { status: 400 }
      );
    }

    // Validate detailed scores
    const validScores: Record<string, number> = {};
    Object.entries(detailedScores).forEach(([key, value]) => {
      if (typeof value === 'number' && value >= 1 && value <= 10) {
        validScores[key] = value;
      }
    });

    if (Object.keys(validScores).length === 0) {
      return NextResponse.json(
        { error: 'At least one valid score (1-10) is required' },
        { status: 400 }
      );
    }

    // Calculate overall score using backend formula
    const overallScore = calculateOverallScore(validScores);

    // Update answer with calculated score
    const updatedAnswer = await JdAnswerService.updateAnswer(answerId, {
      scores: validScores,
      overallScore: overallScore
    });

    return NextResponse.json({
      success: true,
      answerId: updatedAnswer.id,
      detailedScores: validScores,
      overallScore: overallScore,
      message: 'Score calculated and updated successfully'
    });

  } catch (error) {
    console.error('Error calculating JD answer score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}

/**
 * Get score calculation preview without saving
 */
export async function POST(req: NextRequest) {
  try {
    const { detailedScores } = await req.json();

    if (!detailedScores) {
      return NextResponse.json(
        { error: 'Detailed scores are required' },
        { status: 400 }
      );
    }

    // Validate detailed scores
    const validScores: Record<string, number> = {};
    Object.entries(detailedScores).forEach(([key, value]) => {
      if (typeof value === 'number' && value >= 1 && value <= 10) {
        validScores[key] = value;
      }
    });

    if (Object.keys(validScores).length === 0) {
      return NextResponse.json(
        { error: 'At least one valid score (1-10) is required' },
        { status: 400 }
      );
    }

    // Calculate overall score using backend formula
    const overallScore = calculateOverallScore(validScores);

    return NextResponse.json({
      success: true,
      detailedScores: validScores,
      overallScore: overallScore,
      formula: {
        description: 'Overall score = Simple average of all detailed scores',
        calculation: `(${Object.keys(validScores).join(' + ')}) / ${Object.keys(validScores).length}`
      }
    });

  } catch (error) {
    console.error('Error calculating score preview:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score preview' },
      { status: 500 }
    );
  }
}