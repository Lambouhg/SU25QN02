import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Lấy chi tiết một Assessment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const assessment = await prisma.assessment.findFirst({
      where: {
        id,
        userId, // Đảm bảo user chỉ lấy được assessment của mình
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Cập nhật Assessment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { type, ...rest } = body;

    // Kiểm tra type hợp lệ nếu có cập nhật
    if (type && type !== 'test' && type !== 'eq') {
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }

    const assessment = await prisma.assessment.updateMany({
      where: {
        id,
        userId, // Đảm bảo user chỉ cập nhật được assessment của mình
      },
      data: {
        ...(type && { type }),
        ...rest,
        updatedAt: new Date(),
      },
    });

    if (assessment.count === 0) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ 
      error: 'Cập nhật kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Xóa Assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const assessment = await prisma.assessment.deleteMany({
      where: {
        id,
        userId, // Đảm bảo user chỉ xóa được assessment của mình
      },
    });

    if (assessment.count === 0) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json({ 
      error: 'Xóa kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 