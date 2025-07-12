import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Question from '@/models/question';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

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
    const { question, answers, fields, topics, levels, explanation } = body;

    // Define the type for an answer object
    type Answer = {
      text: string;
      isCorrect: boolean;
      [key: string]: unknown;
    };

    // Ensure fields, topics and levels are always arrays
    const validatedFields = Array.isArray(fields) ? fields : [];
    const validatedTopics = Array.isArray(topics) ? topics : [];
    const validatedLevels = Array.isArray(levels) ? levels : [];

    // Validate at least one correct answer
    const hasCorrectAnswer = (answers as Answer[]).some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { error: 'At least one answer must be marked as correct' },
        { status: 400 }
      );
    }

    const newQuestion = new Question({
      question: question,
      answers: answers,
      fields: validatedFields,
      topics: validatedTopics,
      levels: validatedLevels,
      explanation: explanation,
      createdBy: user._id
    });

    await newQuestion.save();

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const field = searchParams.get('field');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (field) query.fields = field;
    if (topic) query.topics = topic;
    if (level) query.levels = level;
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}