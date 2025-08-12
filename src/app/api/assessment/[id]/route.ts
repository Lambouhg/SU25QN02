import { NextRequest, NextResponse } from 'next/server';
import {  } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

// PATCH - Update assessment with new question/answer real-time
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 [PATCH API] PATCH endpoint called');
  
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  console.log(`🔄 [PATCH API] Assessment ID: ${id}, User: ${userId}`);
  
  if (!id) {
    return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log('🔄 [PATCH API] Request body:', body);
    
    const { 
      question, 
      answer, 
      evaluation, 
      topic, 
      questionNumber,
      realTimeScores,
      isComplete = false 
    } = body;

    // Tìm assessment
    const assessment = await prisma.assessment.findUnique({
      where: { 
        id,
        userId // Sử dụng Clerk userId trực tiếp
      }
    });

    console.log(`🔄 [PATCH API] Assessment found: ${assessment ? 'yes' : 'no'}`);
    if (assessment) {
      console.log(`🔄 [PATCH API] Current history length: ${assessment.history ? JSON.parse(assessment.history as string).length : 0}`);
    }

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Parse history hiện tại
    interface HistoryItem {
      question: string;
      answer: string;
      evaluation: {
        scores?: {
          fundamental?: number;
          logic?: number;
          language?: number;
        };
        [key: string]: unknown;
      };
      topic?: string;
      timestamp: string;
      questionNumber?: number;
    }

    let currentHistory: HistoryItem[] = [];
    try {
      currentHistory = assessment.history ? JSON.parse(assessment.history as string) : [];
    } catch (error) {
      console.warn('Error parsing existing history:', error);
      currentHistory = [];
    }

    // Thêm câu hỏi/đáp án mới vào history
    if (question && answer && evaluation) {
      const newHistoryItem = {
        question,
        answer,
        evaluation,
        topic,
        timestamp: new Date().toISOString(),
        questionNumber
      };
      
      currentHistory.push(newHistoryItem);
      console.log(`🔄 [PATCH API] Added new history item. Total items: ${currentHistory.length}`);
    } else {
      console.log(`🔄 [PATCH API] Missing required fields: question=${!!question}, answer=${!!answer}, evaluation=${!!evaluation}`);
    }

    // Chuẩn bị data update
    interface UpdateData {
      history: string;
      updatedAt: Date;
      realTimeScores?: object;
      finalScores?: object;
      status?: string;
    }

    const updateData: UpdateData = {
      history: JSON.stringify(currentHistory),
      updatedAt: new Date()
    };

    // Cập nhật realTimeScores nếu có
    if (realTimeScores) {
      updateData.realTimeScores = realTimeScores;
    }

    // Nếu assessment hoàn thành, tính toán finalScores
    if (isComplete && currentHistory.length > 0) {
      const calculateFinalScores = () => {
        interface HistoryStage {
          evaluation?: {
            scores?: {
              fundamental?: number;
              logic?: number;
              language?: number;
            };
          };
        }

        const validStages = currentHistory.filter((stage: HistoryStage) => 
          stage.evaluation?.scores && 
          typeof stage.evaluation.scores.fundamental === 'number' &&
          typeof stage.evaluation.scores.logic === 'number' &&
          typeof stage.evaluation.scores.language === 'number'
        );

        if (validStages.length === 0) {
          return {
            fundamentalKnowledge: 0,
            logicalReasoning: 0,
            languageFluency: 0,
            overall: 0
          };
        }

        interface ScoreAccumulator {
          fundamental: number;
          logic: number;
          language: number;
        }

        const totalScores = validStages.reduce((acc: ScoreAccumulator, stage: HistoryStage) => ({
          fundamental: acc.fundamental + (stage.evaluation?.scores?.fundamental || 0),
          logic: acc.logic + (stage.evaluation?.scores?.logic || 0),
          language: acc.language + (stage.evaluation?.scores?.language || 0)
        }), {
          fundamental: 0,
          logic: 0,
          language: 0
        });

        const averageScores = {
          fundamentalKnowledge: totalScores.fundamental / validStages.length,
          logicalReasoning: totalScores.logic / validStages.length,
          languageFluency: totalScores.language / validStages.length
        };

        return {
          ...averageScores,
          overall: (averageScores.fundamentalKnowledge + averageScores.logicalReasoning + averageScores.languageFluency) / 3
        };
      };

      updateData.finalScores = calculateFinalScores();
      updateData.status = 'completed';
    }

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        position: true
      }
    });

    console.log(`✅ [PATCH API] Updated assessment ${id} with ${currentHistory.length} history items`);

    return NextResponse.json({
      success: true,
      assessment: updatedAssessment,
      historyCount: currentHistory.length
    });

  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ 
      error: 'Failed to update assessment', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    const body = await request.json();
    
    // Kiểm tra assessment tồn tại
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existingAssessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu
    if (existingAssessment.userId !== userId) {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }
    
    // Cập nhật assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: body,
      include: {
        position: true,
      },
    });

    // Track khi assessment được cập nhật hoàn chỉnh (có điểm số)
    if (body.finalScores || body.realTimeScores) {
      await TrackingIntegrationService.trackAssessmentCompletion(userId, updatedAssessment);
    }

    return (NextResponse.json(updatedAssessment));
  } catch (error) {
    console.error('Error updating assessment:', error);
    return (NextResponse.json({ 
      error: 'Cập nhật kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        position: true,
      },
    });

    if (!assessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu hoặc là admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (assessment.userId !== userId && user?.role !== 'admin') {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }

    return (NextResponse.json(assessment));
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return (NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    // Kiểm tra assessment tồn tại và quyền sở hữu
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existingAssessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu hoặc là admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (existingAssessment.userId !== userId && user?.role !== 'admin') {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }

    // Xóa assessment
    await prisma.assessment.delete({
      where: { id },
    });

    return (NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return (NextResponse.json({ 
      error: 'Xóa kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}
