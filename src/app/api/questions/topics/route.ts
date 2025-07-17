import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả các topics từ question bank
    const questions = await prisma.question.findMany({ select: { topics: true } });
    // Flatten và lấy unique
    const allTopics = questions.flatMap(q => q.topics || []);
    const uniqueTopics = Array.from(new Set(allTopics));
    return NextResponse.json(uniqueTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}