import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from '@/lib/utils';

interface Answer {
  content: string;
  isCorrect?: boolean;
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

    // Shuffle thứ tự các câu hỏi
    const shuffledQuestions = shuffleArray([...originalQuiz.questions]);

    // Xử lý questions - shuffle cả questions và answers
    const questionsWithShuffledAnswers: Array<{
      id: string;
      question: string;
      answers: Array<{ content: string }>;
      explanation?: string | null;
      isMultipleChoice?: boolean;
      fields: string[];
      topics: string[];
      levels: string[];
      createdAt?: Date | null;
      updatedAt?: Date | null;
      createdById?: string | null;
    }> = [];
    const answerMapping: Record<string, number[]> = {};

    shuffledQuestions.forEach(question => {
      const answers = (question.answers as unknown) as Answer[];
      if (answers && answers.length > 0) {
        // Shuffle answers và lấy mapping
        const { shuffledAnswers, mapping } = shuffleAnswers(answers);
        
        // Lưu mapping cho câu hỏi này
        answerMapping[question.id] = mapping;
        
        console.log(`Retry - Question ${question.id}: shuffled answers`);
        
        // Loại bỏ trường isCorrect khỏi answers khi trả về
        const answersWithoutCorrect = shuffledAnswers.map((answer: Answer) => ({
          content: answer.content,
          // Không bao gồm isCorrect
        }));
        
        // Đếm số lượng đáp án đúng để xác định loại câu hỏi
        const correctAnswerCount = shuffledAnswers.filter((answer: Answer) => answer.isCorrect).length;
        
        questionsWithShuffledAnswers.push({
          ...question,
          answers: answersWithoutCorrect,
          isMultipleChoice: correctAnswerCount > 1 // Thêm thông tin về loại câu hỏi
        });
      } else {
        questionsWithShuffledAnswers.push({
          ...question,
          answers: [],
          isMultipleChoice: false
        });
      }
    });

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

    // Trả về quiz mới với câu hỏi và đáp án đã được shuffle
    const quizWithShuffledContent = {
      ...newQuiz,
      questions: questionsWithShuffledAnswers,
      answerMapping: answerMapping
    };

    return withCORS(NextResponse.json(quizWithShuffledContent, { status: 201 }));
  } catch (error) {
    console.error('Error retrying quiz:', error);
    return withCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 