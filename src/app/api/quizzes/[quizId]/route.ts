import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from '@/lib/utils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { quizId } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return withCORS(NextResponse.json({ error: 'Quiz not found' }, { status: 404 }));
    }

    // Kiểm tra xem quiz có answerMapping không (retry quiz)
    const answerMapping = quiz.answerMapping as Record<string, number[]> || {};
    
    console.log(`GET Quiz ${quizId}: hasAnswerMapping=${Object.keys(answerMapping).length > 0}`);

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
      userAnswers: quiz.userAnswers as Array<{ questionId: string; answerIndex: number[]; isCorrect?: boolean }> || [],
      totalQuestions: quiz.totalQuestions,
      retryCount: quiz.retryCount || 0,
      answerMapping: answerMapping, // Bao gồm answerMapping
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: quiz.questions.map((q: any) => {
        const answers = q.answers || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        
        // Nếu có answerMapping cho câu hỏi này, shuffle answers theo mapping
        const mapping = answerMapping[q.id];
        let processedAnswers = answers;
        
        if (mapping && mapping.length > 0) {
          // Tạo answers đã shuffle theo mapping
          processedAnswers = mapping.map((originalIndex: number) => answers[originalIndex]);
        }
        
        return {
          id: q.id,
          question: q.question,
          answers: processedAnswers.map((answer: { content: string; isCorrect?: boolean }) => ({
            content: answer.content,
            // Chỉ bao gồm isCorrect nếu quiz đã hoàn thành
            ...(quiz.completedAt && { isCorrect: answer.isCorrect })
          })),
          explanation: q.explanation,
          isMultipleChoice: correctCount > 1
        };
      })
    };

    return withCORS(NextResponse.json(transformedQuiz));
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return withCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { quizId } = await params;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return withCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    // Check if quiz exists and belongs to user
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return withCORS(NextResponse.json({ error: 'Quiz not found' }, { status: 404 }));
    }

    if (quiz.userId !== user.id) {
      return withCORS(NextResponse.json({ error: 'Access denied' }, { status: 403 }));
    }

    // Delete quiz
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return withCORS(NextResponse.json({ message: 'Quiz deleted successfully' }));
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return withCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 