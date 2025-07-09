import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Quiz from '@/models/quiz';
import User from '@/models/user';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('GET /api/quizzes/history - Starting request');
    
    // Check authentication first
    const { userId } = await auth();
    if (!userId) {
      console.log('No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Auth check completed, userId:', userId);

    // Connect to database
    await connectDB();
    console.log('Database connected successfully');

    // Find user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log('User not found, returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('User found:', user._id);

    // Get quiz history
    console.log('Fetching quiz history for user:', user._id);
    const quizzes = await Quiz.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .populate('questions')
      .lean(); // Use lean() for better performance

    console.log('Quiz history fetched successfully, count:', quizzes.length);
    
    // Transform data to ensure it's serializable
    const transformedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id.toString(),
      field: quiz.field,
      topic: quiz.topic,
      level: quiz.level,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      timeLimit: quiz.timeLimit,
      timeUsed: quiz.timeUsed,
      completedAt: quiz.completedAt,
      retryCount: quiz.retryCount,
      userAnswers: quiz.userAnswers || [],
      questions: quiz.questions || []
    }));

    return NextResponse.json(transformedQuizzes);
  } catch (error) {
    console.error('Error in GET /api/quizzes/history:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 