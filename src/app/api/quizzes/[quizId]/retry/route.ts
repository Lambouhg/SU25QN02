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

    const { quizId } = await params;

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy quiz gốc để retry
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!originalQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Kiểm tra xem quiz có thuộc về user này không
    if (originalQuiz.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Retry quiz - giữ nguyên thứ tự answers nhưng loại bỏ isCorrect
    const questionsWithCleanAnswers = originalQuiz.questions.map(question => {
      const answers = question.answers as any[];
      if (answers && answers.length > 0) {
        // Loại bỏ isCorrect khỏi answers khi trả về cho client
        const cleanAnswers = answers.map((answer: any) => ({
          content: answer.content,
          // Không bao gồm isCorrect
        }));
        
        // Đếm số lượng đáp án đúng để xác định loại câu hỏi
        const correctAnswerCount = answers.filter((answer: any) => answer.isCorrect).length;
        
        return {
          ...question,
          answers: cleanAnswers,
          isMultipleChoice: correctAnswerCount > 1
        };
      }
      return question;
    });

    // Create a new quiz with the same questions but shuffled answers
    const quizData = {
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
    };

    const newQuiz = await prisma.quiz.create({
      data: {
        ...quizData,
        // Không tạo answerMapping cho retry quiz
      } as any,
      include: { questions: true },
    });

    // Trả về quiz với câu trả lời đã clean (không có isCorrect)
    const quizWithCleanAnswers = {
      ...newQuiz,
      questions: questionsWithCleanAnswers
    };

    return NextResponse.json(quizWithCleanAnswers, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quizzes/[quizId]/retry:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 