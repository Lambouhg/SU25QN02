import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userAnswers, score, timeUsed } = await req.json();
    const { quizId } = await params;

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        userAnswers,
        score,
        timeUsed,
        completedAt: new Date(),
      },
      include: { questions: true },
    });

    if (!updatedQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Tracking quiz completion
    try {
      // Tính số câu đúng
      const correctAnswers = Array.isArray(userAnswers)
        ? userAnswers.filter((a: any) => a.isCorrect).length
        : 0;
      // Chuyển đổi questions sang format phù hợp nếu cần
      const questions = Array.isArray(updatedQuiz.questions)
        ? updatedQuiz.questions.map((q: any) => ({ topics: q.topics || [] }))
        : [];
      // Gọi tracking
      await TrackingIntegrationService.trackQuizCompletion(
        updatedQuiz.userId,
        questions,
        correctAnswers,
        Math.max(1, Math.round((updatedQuiz.timeUsed || 0) / 60)) // luôn >= 1 phút
      );
    } catch (err) {
      console.error('Error tracking quiz completion:', err);
    }

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error completing quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 