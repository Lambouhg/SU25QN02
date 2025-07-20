import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { clerkId } = params;

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Clerk ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        clerkId: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          clerkId,
          dbConnected: true,
          userExists: false
        },
        { status: 404 }
      );
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return NextResponse.json({
      success: true,
      clerkId: user.clerkId,
      role: user.role,
      email: user.email,
      fullName,
      userExists: true,
      dbConnected: true,
      lastActivity: user.lastActivity,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Debug role check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        dbConnected: false
      },
      { status: 500 }
    );
  }
}
