// api/question-sets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy một question set cụ thể
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate UUID format (Prisma uses UUID instead of ObjectId)
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question set ID' },
        { status: 400 }
      );
    }

    const questionSet = await prisma.jdQuestions.findFirst({ 
      where: { 
        id, 
        userId 
      }
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      questionSet 
    });

  } catch (error) {
    console.error('Error fetching question set:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa một question set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate UUID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question set ID' },
        { status: 400 }
      );
    }

    const questionSet = await prisma.jdQuestions.delete({ 
      where: { 
        id,
        userId 
      }
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Question set deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting question set:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
