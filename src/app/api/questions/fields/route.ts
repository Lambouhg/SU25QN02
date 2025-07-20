import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả các fields từ question bank
    const questions = await prisma.question.findMany({ select: { fields: true } });
    // Flatten và lấy unique
    const allFields = questions.flatMap(q => q.fields || []);
    const uniqueFields = Array.from(new Set(allFields));
    return NextResponse.json(uniqueFields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 