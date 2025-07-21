import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const interviewId = params.id;
  try {
    const session = await auth();
    const clerkId = session?.userId;
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if interview exists and belongs to user
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId: user.id 
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the interview
    await prisma.interview.deleteMany({
      where: { id: interviewId }
    });

    return NextResponse.json(
      { message: 'Interview deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting interview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const clerkId = session?.userId;

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const awaitedParams = await params;
    const interviewId = awaitedParams.id;
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id }
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      evaluation: interview.evaluation,
      conversationHistory: interview.conversationHistory,
      // ...bạn có thể trả thêm các trường khác nếu muốn
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
