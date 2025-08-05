import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from '@/lib/utils';
import { QuizMappingService } from '@/hooks/useQuizMapping';

interface Question {
  id: string;
  question: string;
  answers: { content: string; isCorrect?: boolean }[];
  explanation?: string;
  isMultipleChoice?: boolean;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { quizId } = await params;

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return withCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    // Lấy quiz gốc để retry
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!originalQuiz) {
      return withCORS(NextResponse.json({ error: 'Quiz not found' }, { status: 404 }));
    }

    // Kiểm tra xem quiz có thuộc về user này không
    if (originalQuiz.userId !== user.id) {
      return withCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
    }

    // 1. Xử lý shuffle questions và answers từ quiz gốc
    const { shuffledQuestions, answerMapping, questionsForUI } = QuizMappingService.processRetryQuiz(originalQuiz.questions as unknown as Question[]);

    // Create a new quiz with shuffled questions and answers
    const quizData = {
      userId: user.id,
      field: originalQuiz.field,
      topic: originalQuiz.topic,
      level: originalQuiz.level,
      questions: {
        connect: shuffledQuestions.map(q => ({ id: q.id })),
      },
      totalQuestions: shuffledQuestions.length,
      timeLimit: originalQuiz.timeLimit,
      score: 0,
      timeUsed: 0,
      retryCount: (originalQuiz.retryCount || 0) + 1,
      answerMapping: answerMapping, // Lưu answerMapping để xử lý khi submit
    };

    const newQuiz = await prisma.quiz.create({
      data: quizData,
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

    // 3. Trả về quiz mới với questions đã shuffle (KHÔNG có isCorrect)
    const quizForUI = {
      ...newQuiz,
      questions: questionsForUI,
      answerMapping: answerMapping
    };

    return withCORS(NextResponse.json(quizForUI, { status: 201 }));
  } catch (error) {
    console.error('Error retrying quiz:', error);
    return withCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 