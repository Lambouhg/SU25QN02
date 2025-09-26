import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { JdAnswerService, JdAnswerData, AnalysisResult } from '@/services/jdService/jdAnswerService';
import TrackingEventService from '@/services/trackingEventService';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jdQuestionSetId,
      questionIndex,
      questionText,
      userAnswer,
      analysisResult,
      timeSpent
    }: {
      jdQuestionSetId: string;
      questionIndex: number;
      questionText: string;
      userAnswer: string;
      analysisResult?: AnalysisResult;
      timeSpent?: number;
    } = body;

    // Validate required fields
    if (!jdQuestionSetId || questionIndex === undefined || !questionText || !userAnswer) {
      return NextResponse.json({
        error: 'Missing required fields: jdQuestionSetId, questionIndex, questionText, userAnswer'
      }, { status: 400 });
    }

    // Calculate overall score if we have detailed scores but no overall score
    let calculatedOverallScore = analysisResult?.overallScore;
    if (analysisResult?.detailedScores && !calculatedOverallScore) {
      console.log('🔄 Calculating overall score from detailed scores:', analysisResult.detailedScores);
      try {
        const scoreResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jd/calculate-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            detailedScores: analysisResult.detailedScores
          }),
        });

        if (scoreResponse.ok) {
          const scoreData = await scoreResponse.json();
          console.log('✅ Score API response:', scoreData);
          if (scoreData.success) {
            calculatedOverallScore = scoreData.overallScore;
            console.log('✅ Calculated overall score:', calculatedOverallScore);
          }
        } else {
          console.error('❌ Score API failed with status:', scoreResponse.status);
        }
      } catch (error) {
        console.error('❌ Error calculating overall score:', error);
        // Fallback: calculate simple average if API fails
        const scores = Object.values(analysisResult.detailedScores);
        calculatedOverallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        console.log('🔄 Fallback calculated score:', calculatedOverallScore);
      }
    } else if (calculatedOverallScore) {
      console.log('ℹ️ Using existing overall score:', calculatedOverallScore);
    }

    // Prepare answer data
    const answerData: JdAnswerData = {
      userId,
      jdQuestionSetId,
      questionIndex,
      questionText,
      userAnswer,
      timeSpent,
      ...(analysisResult && {
        feedback: analysisResult.feedback,
        scores: analysisResult.detailedScores,
        overallScore: calculatedOverallScore,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        skillAssessment: analysisResult.skillAssessment,
      }),
    };

    // Check if answer already exists
    const existingAnswer = await JdAnswerService.getAnswer(jdQuestionSetId, questionIndex, userId);

    let result;
    if (existingAnswer) {
      // Calculate overall score if we have detailed scores but no overall score
      let calculatedOverallScore = analysisResult?.overallScore;
      if (analysisResult?.detailedScores && !calculatedOverallScore) {
        console.log('🔄 [UPDATE] Calculating overall score from detailed scores:', analysisResult.detailedScores);
        try {
          const scoreResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/jd/calculate-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              detailedScores: analysisResult.detailedScores
            }),
          });

          if (scoreResponse.ok) {
            const scoreData = await scoreResponse.json();
            console.log('✅ [UPDATE] Score API response:', scoreData);
            if (scoreData.success) {
              calculatedOverallScore = scoreData.overallScore;
              console.log('✅ [UPDATE] Calculated overall score:', calculatedOverallScore);
            }
          } else {
            console.error('❌ [UPDATE] Score API failed with status:', scoreResponse.status);
          }
        } catch (error) {
          console.error('❌ [UPDATE] Error calculating overall score:', error);
          // Fallback: calculate simple average if API fails
          const scores = Object.values(analysisResult.detailedScores);
          calculatedOverallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          console.log('🔄 [UPDATE] Fallback calculated score:', calculatedOverallScore);
        }
      } else if (calculatedOverallScore) {
        console.log('ℹ️ [UPDATE] Using existing overall score:', calculatedOverallScore);
      }

      // Update existing answer with calculated overall score
      const updatedAnalysisResult = analysisResult ? {
        ...analysisResult,
        overallScore: calculatedOverallScore || 0
      } : {
        feedback: '',
        detailedScores: {},
        overallScore: 0,
        strengths: [],
        improvements: [],
      };

      result = await JdAnswerService.updateAnswerWithAnalysis(
        existingAnswer.id,
        updatedAnalysisResult
      );
    } else {
      // Create new answer
      result = await JdAnswerService.saveAnswer(answerData);
    }

    
    try {
      // Ensure User record exists before tracking activity
      const userRecord = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { lastActivity: new Date() },
        create: {
          clerkId: userId,
          email: 'unknown@example.com',
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      await TrackingEventService.trackJdAnswered({
        userId: userRecord.id,
        jdQuestionSetId,
        questionIndex,
        timeSpentSeconds: timeSpent || 0,
        overallScore: calculatedOverallScore,
        strengths: analysisResult?.strengths,
        improvements: analysisResult?.improvements,
        detailedScores: analysisResult?.detailedScores as Record<string, number> | undefined,
        feedback: analysisResult?.feedback,
        skillDeltas: analysisResult?.skillAssessment as Record<string, number> | undefined,
      });
    } catch (activityError) {
      console.error('Error tracking JD activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in JD answers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const jdQuestionSetId = url.searchParams.get('jdQuestionSetId');
    const questionIndex = url.searchParams.get('questionIndex');
    const questionSetId = url.searchParams.get('questionSetId'); // Alternative parameter name
    const type = url.searchParams.get('type'); // 'single', 'set', 'history', 'stats', 'check'

    switch (type) {
      case 'check':
        // Check if answer exists for this question
        const checkQuestionSetId = jdQuestionSetId || questionSetId;
        if (!checkQuestionSetId || questionIndex === null) {
          return NextResponse.json({
            error: 'Missing questionSetId or questionIndex for check'
          }, { status: 400 });
        }

        const existingAnswer = await JdAnswerService.getAnswer(
          checkQuestionSetId,
          parseInt(questionIndex),
          userId
        );

        return NextResponse.json({
          success: true,
          exists: !!existingAnswer,
          answerId: existingAnswer?.id || null,
        });

      case 'single':
        if (!jdQuestionSetId || questionIndex === null) {
          return NextResponse.json({
            error: 'Missing jdQuestionSetId or questionIndex for single answer'
          }, { status: 400 });
        }

        const answer = await JdAnswerService.getAnswer(
          jdQuestionSetId,
          parseInt(questionIndex),
          userId
        );

        return NextResponse.json({
          success: true,
          data: answer,
        });

      case 'set':
        if (!jdQuestionSetId) {
          return NextResponse.json({
            error: 'Missing jdQuestionSetId for answer set'
          }, { status: 400 });
        }

        const answers = await JdAnswerService.getAnswersByQuestionSet(jdQuestionSetId, userId);

        return NextResponse.json({
          success: true,
          data: answers,
        });

      case 'history':
        const limit = url.searchParams.get('limit');
        const history = await JdAnswerService.getUserAnswerHistory(
          userId,
          limit ? parseInt(limit) : 20
        );

        return NextResponse.json({
          success: true,
          data: history,
        });

      case 'stats':
        const stats = await JdAnswerService.getUserStats(userId);

        return NextResponse.json({
          success: true,
          data: stats,
        });

      default:
        return NextResponse.json({
          error: 'Invalid type parameter. Use: single, set, history, or stats'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in JD answers GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const answerId = url.searchParams.get('answerId');

    if (!answerId) {
      return NextResponse.json({
        error: 'Missing answerId parameter'
      }, { status: 400 });
    }

    const result = await JdAnswerService.deleteAnswer(answerId);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in JD answers DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
