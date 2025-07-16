import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'test', positionId, position, ...rest } = body; // Nhận cả positionId và position

    // Kiểm tra type hợp lệ
    if (type !== 'test' && type !== 'eq') {
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }

    // Xây dựng data object
    const data = {
      userId,
      type,
      ...rest,
    };

    // Nếu có positionId, sử dụng positionId
    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId }
      });
      if (!positionRecord) {
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
      data.positionId = positionId;
    } else if (position) {
      // Nếu không có positionId nhưng có position string, tìm hoặc tạo position
      let positionRecord = await prisma.position.findFirst({
        where: { positionName: position }
      });
      
      if (!positionRecord) {
        // Tạo position mới nếu chưa có
        positionRecord = await prisma.position.create({
          data: {
            key: position.toLowerCase().replace(/\s+/g, '_'),
            positionName: position,
            level: 'Junior', // Default level
            displayName: position,
            order: 0
          }
        });
      }
      data.positionId = positionRecord.id;
    }

    const assessment = await prisma.assessment.create({
      data,
      include: {
        position: true, // Include position data trong response
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ 
      error: 'Lưu kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'test' hoặc 'eq'

    // Nếu có type, filter theo type. Nếu không, lấy tất cả
    const where = typeParam && (typeParam === 'test' || typeParam === 'eq')
      ? { userId, type: typeParam as AssessmentType }
      : { userId };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        position: true, // Include position data
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
