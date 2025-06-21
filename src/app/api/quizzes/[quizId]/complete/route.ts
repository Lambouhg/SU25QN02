import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Quiz from '@/models/quiz';
import { connectDB } from '@/lib/mongodb';

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    await connectDB();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userAnswers, score, timeUsed } = await req.json();
    const quizId = params.quizId;

    // Sử dụng findOneAndUpdate thay vì findById và save
    const updatedQuiz = await Quiz.findOneAndUpdate(
      { _id: quizId },
      {
        $set: {
          userAnswers: userAnswers.map((answer: any) => ({
            questionId: answer.questionId,
            answerIndex: answer.answerIndex,
            isCorrect: answer.isCorrect
          })),
          score: score,
          timeUsed: timeUsed,
          completedAt: new Date()
        }
      },
      { new: true } // Trả về document đã được cập nhật
    );

    if (!updatedQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error completing quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 