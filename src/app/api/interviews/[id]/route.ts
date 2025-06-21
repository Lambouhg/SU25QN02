import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Interview from '@/models/interview';

interface MongoError {
  message: string;
  code?: number;
  name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interview);
  } catch (error: unknown) {
    const mongoError = error as MongoError;
    console.error('Error fetching interview:', mongoError);
    return NextResponse.json(
      { error: mongoError.message || 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}
