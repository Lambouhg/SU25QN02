import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Check if user is logged in
    const clerkUser = await currentUser();
    console.log('Clerk user:', clerkUser?.id, clerkUser?.emailAddresses?.[0]?.emailAddress);
    
    if (!clerkUser) {
      return NextResponse.json({ 
        error: 'Not logged in',
        step: 1 
      }, { status: 401 });
    }

    // 2. Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true, email: true, role: true, clerkId: true }
    });
    
    console.log('DB user:', dbUser);
    
    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found in database',
        clerkId: clerkUser.id,
        step: 2 
      }, { status: 404 });
    }

    // 3. Check role
    if (dbUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Not admin',
        role: dbUser.role,
        step: 3 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      user: dbUser,
      message: 'Admin access granted'
    });

  } catch (error) {
    console.error('Admin debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'exception'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
