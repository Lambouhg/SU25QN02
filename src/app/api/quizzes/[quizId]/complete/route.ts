import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

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

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error completing quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 