import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Hàm shuffleArray để random mảng
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Hàm shuffle answers và trả về mapping
function shuffleAnswers(answers: any[]): { shuffledAnswers: any[], mapping: number[] } {
  const originalIndexes = answers.map((_, index) => index);
  const shuffledIndexes = shuffleArray([...originalIndexes]);
  
  const shuffledAnswers = shuffledIndexes.map(index => answers[index]);
  
  // Tạo mapping từ vị trí gốc về vị trí mới: mapping[originalIndex] = newIndex
  const mapping = new Array(answers.length);
  shuffledIndexes.forEach((originalIndex, newIndex) => {
    mapping[originalIndex] = newIndex;
  });
  
  return { shuffledAnswers, mapping };
}

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

    // Tạo answer mapping mới cho từng câu hỏi (khác với lần trước)
    const answerMapping: Record<string, number[]> = {};
    const questionsWithShuffledAnswers = originalQuiz.questions.map(question => {
      const answers = question.answers as any[];
      if (answers && answers.length > 0) {
        const { shuffledAnswers, mapping } = shuffleAnswers(answers);
        answerMapping[question.id] = mapping;
        return {
          ...question,
          answers: shuffledAnswers
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
        answerMapping,
      } as any,
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

    // Trả về quiz với câu trả lời đã được shuffle
    const quizWithShuffledAnswers = {
      ...newQuiz,
      questions: questionsWithShuffledAnswers
    };

    return NextResponse.json(quizWithShuffledAnswers, { status: 201 });
  } catch (error) {
    console.error('Error retrying quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 