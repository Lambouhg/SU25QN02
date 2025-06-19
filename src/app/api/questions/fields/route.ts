import { NextResponse } from 'next/server';
import Question from '@/models/question';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const fields = await Question.distinct('fields');
    return NextResponse.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 