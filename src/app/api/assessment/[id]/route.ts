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
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const {
      question,
      answer,
      evaluation,
      topic,
      questionNumber,
      realTimeScores,
      finalScores,
      status
    } = body;

    // Tìm assessment
    const assessment = await prisma.assessment.findFirst({
      where: { id, userId }
    });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Parse history hiện tại
    type HistoryItem = {
      question: string;
      answer: string;
      evaluation: unknown;
      topic?: string;
      timestamp: string;
      questionNumber?: number;
    };
    let currentHistory: HistoryItem[] = [];
    try {
      currentHistory = assessment.history ? JSON.parse(String(assessment.history)) as HistoryItem[] : [];
    } catch {
      currentHistory = [];
    }

    // Luôn lưu lịch sử vào trường history (array), mỗi lần chấm điểm sẽ push thêm 1 item
    if (question && answer && evaluation) {
      currentHistory.push({
        question,
        answer,
        evaluation,
        topic,
        timestamp: new Date().toISOString(),
        questionNumber
      });
    }

    // realTimeScores chỉ lưu điểm số mới nhất (của lần chấm hiện tại)
    // Nếu có realTimeScores trong body thì cập nhật, nếu không thì lấy từ evaluation.scores
    let latestRealTimeScores = realTimeScores;
    if (!latestRealTimeScores && evaluation && typeof evaluation === 'object' && 'scores' in evaluation && evaluation.scores) {
      latestRealTimeScores = {
        fundamental: evaluation.scores.fundamental || 0,
        logic: evaluation.scores.logic || 0,
        language: evaluation.scores.language || 0,
        suggestions: evaluation.suggestions || { fundamental: '', logic: '', language: '' }
      };
    }

    // Generate overall feedback by concatenating all feedbacks from history
    const allFeedbacks = currentHistory
      .map(item => {
        // Nếu feedback nằm trong evaluation.suggestions hoặc item.feedback
        if (
          item.evaluation &&
          typeof item.evaluation === 'object' &&
          'suggestions' in item.evaluation &&
          item.evaluation.suggestions &&
          typeof item.evaluation.suggestions === 'object'
        ) {
          return Object.values(item.evaluation.suggestions).join(' ');
        }
        if ('feedback' in item && item.feedback) {
          return item.feedback;
        }
        return '';
      })
      .filter(Boolean)
      .join(' | ');

    // Tính điểm tổng (overallScore) nếu kết thúc phỏng vấn
    let calculatedFinalScores = finalScores;
    if (status === 'completed' && currentHistory.length > 0) {
      // Tính trung bình các điểm số từng câu
      let totalFundamental = 0, totalLogic = 0, totalLanguage = 0, count = 0;
      currentHistory.forEach(item => {
        if (
          item.evaluation &&
          typeof item.evaluation === 'object' &&
          'scores' in item.evaluation &&
          item.evaluation.scores &&
          typeof item.evaluation.scores === 'object'
        ) {
          const scores = item.evaluation.scores as Record<string, number>;
          totalFundamental += scores.fundamental || 0;
          totalLogic += scores.logic || 0;
          totalLanguage += scores.language || 0;
          count++;
        }
      });
      if (count > 0) {
        calculatedFinalScores = {
          fundamental: Math.round((totalFundamental / count) * 100) / 100,
          logic: Math.round((totalLogic / count) * 100) / 100,
          language: Math.round((totalLanguage / count) * 100) / 100,
        };
      }
    }

    // Chuẩn bị data update
    const updateData: Record<string, unknown> = {
      history: JSON.stringify(currentHistory),
      updatedAt: new Date(),
      overallFeedback: allFeedbacks
    };
    if (latestRealTimeScores) updateData.realTimeScores = latestRealTimeScores;
    if (calculatedFinalScores) updateData.finalScores = calculatedFinalScores;
    if (status) updateData.status = status;

    // Update assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: { jobRole: true }
    });

    return NextResponse.json({
      success: true,
      assessment: updatedAssessment,
      historyCount: currentHistory.length,
      overallFeedback: allFeedbacks
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment', detail: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
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
        jobRole: true,
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
        jobRole: true,
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
