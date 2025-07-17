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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { field, topic, level, count, timeLimit } = body;

    // Lấy tất cả câu hỏi phù hợp
    const allQuestions = await prisma.question.findMany({
      where: {
        fields: { has: field },
        topics: { has: topic },
        levels: { has: level },
      },
    });

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    // Shuffle và lấy random count câu hỏi
    const shuffled = shuffleArray([...allQuestions]);
    const questions = shuffled.slice(0, parseInt(count));

    // Tạo quiz mới
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        field,
        topic,
        level,
        questions: {
          connect: questions.map(q => ({ id: q.id })),
        },
        totalQuestions: questions.length,
        timeLimit,
        score: 0,
        timeUsed: 0,
      },
      include: { questions: true },
    });

    // Update user's quiz history (nếu cần)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        quizHistory: {
          connect: { id: quiz.id },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy danh sách quiz của user, kèm questions
    const quizzes = await prisma.quiz.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
      include: { questions: true },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error in GET /api/quizzes:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}