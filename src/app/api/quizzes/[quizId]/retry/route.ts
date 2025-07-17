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

    // Find user
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the original quiz
    const { quizId } = await params;
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!originalQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Create a new quiz with the same questions
    const newQuiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        field: originalQuiz.field,
        topic: originalQuiz.topic,
        level: originalQuiz.level,
        questions: {
          connect: originalQuiz.questions.map(q => ({ id: q.id })),
        },
        totalQuestions: originalQuiz.totalQuestions,
        timeLimit: originalQuiz.timeLimit,
        score: 0,
        timeUsed: 0,
        retryCount: (originalQuiz.retryCount || 0) + 1,
      },
      include: { questions: true },
    });

    // Update user's quiz history
    await prisma.user.update({
      where: { id: user.id },
      data: {
        quizHistory: {
          connect: { id: newQuiz.id },
        },
      },
    });

    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error) {
    console.error('Error retrying quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 