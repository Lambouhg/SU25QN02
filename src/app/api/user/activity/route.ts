import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user's last activity and online status
    await prisma.user.update({
      where: { clerkId },
      data: {
        lastActivity: new Date(),
        isOnline: true,
        clerkSessionActive: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
