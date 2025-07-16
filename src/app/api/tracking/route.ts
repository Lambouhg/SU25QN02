import { NextResponse } from 'next/server';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm user trong Prisma database bằng clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Initialize a new user if needed
      return NextResponse.json({
        stats: {
          totalInterviews: 0,
          averageScore: 0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        skillProgress: [],
        currentFocus: ['Complete your profile', 'Start your first interview practice'],
        nextMilestones: [
          {
            goal: 'Complete first interview practice',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          'Complete your profile to get personalized recommendations',
          'Try a practice interview to assess your current level',
          'Set your learning goals in the dashboard'
        ]
      });
    }

    const progress = await TrackingIntegrationService.getProgressOverview(user.id);
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    // Return a more detailed error message in development
    const message = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Failed to fetch progress';
      
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
