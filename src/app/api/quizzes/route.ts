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

    // Chuẩn hóa field, topic, level để so sánh không phân biệt hoa thường/khoảng trắng
    const norm = (str: string) => str.trim().toLowerCase();
    const normField = norm(field);
    const normTopic = norm(topic);
    const normLevel = norm(level);

    // Lấy tất cả câu hỏi phù hợp (không phân biệt hoa thường/khoảng trắng)
    const allQuestions = (await prisma.question.findMany({})).filter(q =>
      q.fields.some(f => norm(f) === normField) &&
      q.topics.some(t => norm(t) === normTopic) &&
      q.levels.some(l => norm(l) === normLevel)
    );

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    // Shuffle và lấy random count câu hỏi
    const shuffled = shuffleArray([...allQuestions]);
    const questions = shuffled.slice(0, parseInt(count));

    // Tạo answer mapping cho từng câu hỏi
    const answerMapping: Record<string, number[]> = {};
    const questionsWithShuffledAnswers = questions.map(question => {
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

    // Tạo quiz mới
    const quizData = {
      userId: user.id,
      field,
      topic,
      level,
      questions: {
        connect: questions.map(q => ({ id: q.id })),
      },
      totalQuestions: questions.length,
      timeLimit: parseInt(timeLimit), // Đảm bảo là Int
      score: 0,
      timeUsed: 0,
    };

    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        answerMapping,
      } as any,
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

    // Trả về quiz với câu trả lời đã được shuffle
    const quizWithShuffledAnswers = {
      ...quiz,
      questions: questionsWithShuffledAnswers
    };

    return NextResponse.json(quizWithShuffledAnswers, { status: 201 });
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