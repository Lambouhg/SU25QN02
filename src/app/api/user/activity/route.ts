import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info from Clerk
    const user = await currentUser();
    
    // Upsert user - create if not exists, update if exists
    await prisma.user.upsert({
      where: { clerkId },
      update: {
        lastActivity: new Date(),
        isOnline: true,
        clerkSessionActive: true
      },
      create: {
        clerkId,
        email: user?.emailAddresses?.[0]?.emailAddress || '',
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        avatar: user?.imageUrl || null,
        roleId: 'user_role_id', // Default role
        lastActivity: new Date(),
        isOnline: true,
        clerkSessionActive: true,
        skills: []
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
