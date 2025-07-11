import { NextRequest, NextResponse } from 'next/server';
import Position from '@/models/position';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  await connectDB();

  try {
    const positions = await Position.find().sort({ order: 1 }); // Sắp xếp theo thứ tự
    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json(); // Lấy dữ liệu từ body
    const { key, value, type, order } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const newPosition = await Position.create({ key, value, type: type || '', order }); // Lưu type rỗng nếu không có
    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}