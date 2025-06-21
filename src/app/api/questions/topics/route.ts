import { NextResponse } from 'next/server';
import Question from '@/models/question';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const topics = await Question.distinct('topics');
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}