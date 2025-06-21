import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import TestPanelResult from '@/models/TestPanelResult';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  try {
    const body = await request.json();
    const result = await TestPanelResult.create({ ...body, userId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Lưu kết quả thất bại', detail: error }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectDB();
  try {
    const results = await TestPanelResult.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Lấy kết quả thất bại', detail: error }, { status: 500 });
  }
} 