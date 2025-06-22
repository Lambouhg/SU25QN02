import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Quiz from '@/models/quiz';
import Question from '@/models/question';
import User from '@/models/user';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by clerkId
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { field, topic, level, count, timeLimit } = body;

    // Get random questions that match the field, topic and level
    const questions = await Question.aggregate([
      {
        $match: {
          fields: { $in: [field] },
          topics: { $in: [topic] },
          levels: { $in: [level] }
        }
      },
      { $sample: { size: parseInt(count) } }
    ]);

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    const quiz = new Quiz({
      userId: user._id,
      field,
      topic,
      level,
      questions: questions.map(q => q._id),
      totalQuestions: questions.length,
      timeLimit,
      score: 0,
      timeUsed: 0
    });

    await quiz.save();

    // Update user's quiz history
    await User.findByIdAndUpdate(user._id, {
      $push: { quizHistory: quiz._id }
    });

    // Populate the questions data
    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');
    return NextResponse.json(populatedQuiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
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

    const quizzes = await Quiz.find({ userId: user._id }).sort({ completedAt: -1 });
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}