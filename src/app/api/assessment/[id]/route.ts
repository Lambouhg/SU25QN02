import { NextRequest, NextResponse } from 'next/server';
import {  } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    const body = await request.json();
    
    // Kiểm tra assessment tồn tại
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existingAssessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu
    if (existingAssessment.userId !== userId) {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }
    
    // Cập nhật assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: body,
      include: {
        position: true,
      },
    });

    // Track khi assessment được cập nhật hoàn chỉnh (có điểm số)
    if (body.finalScores || body.realTimeScores) {
      await TrackingIntegrationService.trackAssessmentCompletion(userId, updatedAssessment);
    }

    return (NextResponse.json(updatedAssessment));
  } catch (error) {
    console.error('Error updating assessment:', error);
    return (NextResponse.json({ 
      error: 'Cập nhật kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        position: true,
      },
    });

    if (!assessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu hoặc là admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (assessment.userId !== userId && user?.role !== 'admin') {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }

    return (NextResponse.json(assessment));
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return (NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const { id } = await params;
  if (!id) {
    return (NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 }));
  }

  try {
    // Kiểm tra assessment tồn tại và quyền sở hữu
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existingAssessment) {
      return (NextResponse.json({ error: 'Assessment not found' }, { status: 404 }));
    }

    // Kiểm tra quyền sở hữu hoặc là admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (existingAssessment.userId !== userId && user?.role !== 'admin') {
      return (NextResponse.json({ error: 'Permission denied' }, { status: 403 }));
    }

    // Xóa assessment
    await prisma.assessment.delete({
      where: { id },
    });

    return (NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return (NextResponse.json({ 
      error: 'Xóa kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 }));
  }
}
