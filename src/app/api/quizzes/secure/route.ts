import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Define Answer interface
interface Answer {
  content: string;
  isCorrect: boolean;
}

// Hàm shuffleArray để random mảng
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Hàm shuffle answers và trả về mapping
function shuffleAnswers(answers: Answer[]): { shuffledAnswers: Answer[], mapping: number[] } {
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

    // Find user
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { field, topic, level, count, timeLimit } = await req.json();

    // Validate input
    if (!field || !topic || !level || !count || !timeLimit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get questions from database
    const questions = await prisma.question.findMany({
      where: {
        fields: { has: field },
        topics: { has: topic },
        levels: { has: level },
      },
      take: count,
      orderBy: {
        id: 'asc',
      },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for the specified criteria' }, { status: 404 });
    }

    // Shuffle thứ tự các câu hỏi
    const shuffledQuestions = shuffleArray([...questions]);

    // Tạo answer mapping cho từng câu hỏi
    const answerMapping: Record<string, number[]> = {};
    const questionsWithShuffledAnswers = shuffledQuestions.map(question => {
      const answers = question.answers as unknown as Answer[];
      if (answers && answers.length > 0) {
        const { shuffledAnswers, mapping } = shuffleAnswers(answers);
        answerMapping[question.id] = mapping;
        
        // Loại bỏ trường isCorrect khỏi answers khi trả về
        const answersWithoutCorrect = shuffledAnswers.map((answer: Answer) => ({
          content: answer.content,
          // Không bao gồm isCorrect
        }));
        
        // Đếm số lượng đáp án đúng để xác định loại câu hỏi
        const correctAnswerCount = shuffledAnswers.filter((answer: Answer) => answer.isCorrect).length;
        
        return {
          ...question,
          answers: answersWithoutCorrect,
          isMultipleChoice: correctAnswerCount > 1 // Thêm thông tin về loại câu hỏi
        };
      }
      return question;
    });

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        field,
        topic,
        level,
        questions: {
          connect: shuffledQuestions.map(q => ({ id: q.id })),
        },
        totalQuestions: questions.length,
        timeLimit,
        score: 0,
        timeUsed: 0,
        retryCount: 0,
        answerMapping,
      },
      include: { questions: true },
    });

    // Update user's quiz history
    await prisma.user.update({
      where: { id: user.id },
      data: {
        quizHistory: {
          connect: { id: quiz.id },
        },
      },
    });

    // Trả về quiz với câu trả lời đã được shuffle và KHÔNG có isCorrect
    const quizWithShuffledAnswers = {
      ...quiz,
      questions: questionsWithShuffledAnswers
    };

    return NextResponse.json(quizWithShuffledAnswers, { status: 201 });
  } catch (error) {
    console.error('Error creating secure quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 