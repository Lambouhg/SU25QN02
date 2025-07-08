import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    const { clerkId } = await params;

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Clerk ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const user = await User.findOne({ clerkId }).lean() as {
      clerkId: string;
      role: string;
      email: string;
      fullName: string;
      lastActivity?: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    
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

    return NextResponse.json({
      success: true,
      clerkId: user.clerkId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
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
