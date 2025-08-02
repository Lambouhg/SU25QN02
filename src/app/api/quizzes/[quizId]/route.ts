import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Transform data để phù hợp với UI
    const transformedQuiz = {
      id: quiz.id,
      field: quiz.field,
      topic: quiz.topic,
      level: quiz.level,
      completedAt: quiz.completedAt?.toISOString(),
      score: quiz.score,
      timeUsed: quiz.timeUsed,
      timeLimit: quiz.timeLimit,
      userAnswers: quiz.userAnswers as any[] || [],
      totalQuestions: quiz.totalQuestions,
      retryCount: quiz.retryCount || 0,
      questions: quiz.questions.map((q: any) => {
        const answers = q.answers || [];
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        return {
          id: q.id,
          question: q.question,
          answers: answers.map((answer: any) => ({
            content: answer.content,
            isCorrect: answer.isCorrect
          })),
          explanation: q.explanation,
          isMultipleChoice: correctCount > 1
        };
      })
    };

    return NextResponse.json(transformedQuiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 