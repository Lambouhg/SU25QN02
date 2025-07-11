import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Question from '@/models/question';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const question = await Question.findById(id);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = getAuth(req);
    
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

    // Define a type for answer
    type Answer = { text: string; isCorrect: boolean };

    // Validate at least one correct answer
    const hasCorrectAnswer = (answers as Answer[]).some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { error: 'At least one answer must be marked as correct' },
        { status: 400 }
      );
    }

    // Validate at least one field, topic and level
    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be selected' },
        { status: 400 }
      );
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'At least one topic must be selected' },
        { status: 400 }
      );
    }

    if (!levels || levels.length === 0) {
      return NextResponse.json(
        { error: 'At least one level must be selected' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const existingQuestion = await Question.findById(id);
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or admin
    if (existingQuestion.createdBy.toString() !== user._id.toString()) {
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to edit this question' },
          { status: 403 }
        );
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        question,
        answers,
        fields,
        topics,
        levels,
        explanation,
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by clerkId
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const existingQuestion = await Question.findById(id);
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or admin
    if (existingQuestion.createdBy.toString() !== user._id.toString()) {
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to delete this question' },
          { status: 403 }
        );
      }
    }

    await Question.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}