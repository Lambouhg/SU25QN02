import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import type {  Interview } from '@prisma/client';

type PrismaError = Error & { code?: string };

interface InterviewStats {
  totalInterviews: number;
  [key: string]: number;
}

interface InterviewWithPosition extends Interview {
  position: {
    id: string;
    key: string;
    positionName: string;
    level: string;
    displayName: string;
    order: number;
  };
}



// Request data interface
interface CreateInterviewRequest {
  positionId: string;
  language?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: number;
  conversationHistory?: Array<{
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp?: string | Date;
  }>;
  evaluation?: {
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    overallRating: number;
    recommendations: string[];
  };
  questionCount?: number;
  coveredTopics?: string[];
  skillAssessment?: Record<string, number>;
  progress?: number;
  status?: 'in_progress' | 'completed';  // Add status field
}

// Validate interview data
function validateInterviewData(data: unknown): data is CreateInterviewRequest {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid request data');
  }

  const request = data as Partial<CreateInterviewRequest>;

  if (!request.positionId || typeof request.positionId !== 'string') {
    throw new Error('positionId is required and must be a string');
  }

  // Validate dates if provided
  if (request.startTime) {
    const startTime = new Date(request.startTime);
    if (isNaN(startTime.getTime())) {
      throw new Error('Invalid startTime');
    }
  }

  if (request.endTime) {
    const endTime = new Date(request.endTime);
    if (isNaN(endTime.getTime())) {
      throw new Error('Invalid endTime');
    }
  }

  // Validate numeric fields
  if (request.duration !== undefined && (isNaN(request.duration) || request.duration < 0)) {
    throw new Error('duration must be a positive number');
  }

  if (request.questionCount !== undefined && (isNaN(request.questionCount) || request.questionCount < 0)) {
    throw new Error('questionCount must be a positive number');
  }

  if (request.progress !== undefined && (isNaN(request.progress) || request.progress < 0 || request.progress > 100)) {
    throw new Error('progress must be between 0 and 100');
  }

  // Validate conversation history if provided
  if (request.conversationHistory) {
    if (!Array.isArray(request.conversationHistory)) {
      throw new Error('conversationHistory must be an array');
    }
    for (const msg of request.conversationHistory) {
      if (typeof msg !== 'object' || msg === null) {
        throw new Error('Invalid conversation message');
      }
      if (!['user', 'ai', 'system'].includes(msg.role)) {
        throw new Error('Invalid message role');
      }
      if (typeof msg.content !== 'string') {
        throw new Error('Message content must be a string');
      }
    }
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    // Get request data
    const data = await req.json() as CreateInterviewRequest;
    if (!validateInterviewData(data)) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
      });
    }

    // Create new interview
    const newInterview = await prisma.interview.create({
      data: {
        userId: dbUser.id,
        positionId: data.positionId,
        language: data.language || 'vi-VN',
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        duration: data.duration || 0,
        conversationHistory: data.conversationHistory ? 
          JSON.parse(JSON.stringify(data.conversationHistory)) : [],
        evaluation: data.evaluation ? 
          JSON.parse(JSON.stringify(data.evaluation)) : {
            technicalScore: 0,
            communicationScore: 0,
            problemSolvingScore: 0,
            overallRating: 0,
            recommendations: []
          },
        questionCount: data.questionCount || 0,
        coveredTopics: data.coveredTopics ? 
          JSON.parse(JSON.stringify(data.coveredTopics)) : [],
        skillAssessment: data.skillAssessment ? 
          JSON.parse(JSON.stringify(data.skillAssessment)) : {},
        progress: data.progress || 0,
        status: data.status || 'in_progress'
      }
    });

    // Only track if interview is completed
    if (data.status === 'completed') {
      // Tracking hoạt động phỏng vấn
      await TrackingIntegrationService.trackInterviewCompletion(dbUser.id, newInterview);

      // Update user's interview stats
      const currentStats = dbUser.interviewStats as InterviewStats || { totalInterviews: 0 };
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          interviewStats: {
            ...currentStats,
            totalInterviews: currentStats.totalInterviews + 1
          }
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Interview created successfully', 
        interviewId: newInterview.id 
      }), 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/interviews:', error);
    
    if (error instanceof Error && (error as PrismaError).code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate interview entry' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Get interviews for the user
    const interviews: InterviewWithPosition[] = await prisma.interview.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
      take: 10,
      include: {
        position: true
      }
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error in GET /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
