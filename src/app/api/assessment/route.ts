import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'test', positionId, ...rest } = body; // Sử dụng positionId thay vì position

    // Kiểm tra type hợp lệ
    if (type !== 'test' && type !== 'eq') {
      const ms = Date.now() - start;
      console.log(`POST /api/assessment 400 in ${ms}ms`);
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }

    // Kiểm tra positionId nếu có
    if (positionId) {
      const position = await prisma.position.findUnique({
        where: { id: positionId }
      });
      if (!position) {
        const ms = Date.now() - start;
        console.log(`POST /api/assessment 400 in ${ms}ms`);
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
    }

    const assessment = await prisma.assessment.create({
      data: {
        userId,
        type: type as AssessmentType,
        positionId, // Sử dụng positionId
        ...rest,
      },
      include: {
        position: true, // Include position data trong response
      },
    });

    // Track assessment completion
    await TrackingIntegrationService.trackAssessmentCompletion(userId, assessment);

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
    const where = {
      userId,
      ...(typeParam === 'test' || typeParam === 'eq' ? { type: typeParam as AssessmentType } : {})
    };

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
