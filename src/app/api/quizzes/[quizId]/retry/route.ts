import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Quiz from '@/models/quiz';
import User from '@/models/user';
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

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the original quiz
    const originalQuiz = await Quiz.findById(params.quizId);
    if (!originalQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Create a new quiz with the same questions
    const newQuiz = new Quiz({
      userId: user._id,
      field: originalQuiz.field,
      topic: originalQuiz.topic,
      level: originalQuiz.level,
      questions: originalQuiz.questions,
      totalQuestions: originalQuiz.totalQuestions,
      timeLimit: originalQuiz.timeLimit,
      score: 0,
      timeUsed: 0,
      retryCount: originalQuiz.retryCount + 1
    });

    await newQuiz.save();

    // Update user's quiz history
    await User.findByIdAndUpdate(user._id, {
      $push: { quizHistory: newQuiz._id }
    });

    // Populate the questions data
    const populatedQuiz = await Quiz.findById(newQuiz._id).populate('questions');
    return NextResponse.json(populatedQuiz, { status: 201 });
  } catch (error) {
    console.error('Error retrying quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 