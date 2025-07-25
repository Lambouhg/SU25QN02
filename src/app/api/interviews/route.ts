import { corsOptionsResponse } from '@/lib/utils';
// Handler for CORS preflight
export async function OPTIONS() {
  return corsOptionsResponse();
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { withCORS } from '@/lib/utils';

type PrismaError = Error & { code?: string };

interface InterviewStats {
  totalInterviews: number;
  [key: string]: number;
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
  status?: 'in_progress' | 'completed' | 'interrupted';  // Add status field
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

// Định nghĩa type Interview cho các callback
type Interview = {
  id: string;
  userId: string;
  positionId: string;
  position: {
    key: string;
    level: string;
  };
  language: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number | null;
  conversationHistory: unknown;
  evaluation?: unknown;
  questionCount: number;
  coveredTopics: string[];
  skillAssessment: unknown;
  progress: number;
  status: 'in_progress' | 'completed' | 'interrupted';
};

// Type for Prisma interview result (endTime and duration can be null)
type InterviewPrisma = Omit<Interview, 'endTime' | 'duration'> & { endTime?: string | Date | null; duration?: number | null };

export async function POST(req: NextRequest) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return withCORS(new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      }));
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return withCORS(new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      }));
    }

    // Get request data
    const data = await req.json() as CreateInterviewRequest;
    if (!validateInterviewData(data)) {
      return withCORS(new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
      }));
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

    return withCORS(new Response(
      JSON.stringify({ 
        message: 'Interview created successfully', 
        interviewId: newInterview.id 
      }), 
      { status: 201 }
    ));
  } catch (error) {
    console.error('Error in POST /api/interviews:', error);
    
    if (error instanceof Error && (error as PrismaError).code === 'P2002') {
      return withCORS(NextResponse.json(
        { error: 'Duplicate interview entry' },
        { status: 409 }
      ));
    }
    
    return withCORS(NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    ));
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const clerkId = session?.userId;
    
    if (!clerkId) {
      return withCORS(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }
    
    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    
    if (!user) {
      return withCORS(NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      ));
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const days = searchParams.get('days');

    // Build filter conditions
    const where: {
      userId: string;
      status?: 'in_progress' | 'completed' | 'interrupted';
      startTime?: { gte: Date };
    } = { userId: user.id };
    
    if (status && status !== 'all') {
      // Type cast the status to string union type
      where.status = status as 'in_progress' | 'completed' | 'interrupted';
    }
    
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      where.startTime = { gte: daysAgo };
    }

    // Get interviews for the user
    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        position: true
      }
    });

    // Calculate stats
    const stats = {
      totalInterviews: interviews.length,
      completedInterviews: interviews.filter((i: InterviewPrisma) => i.status === 'completed').length,
      inProgressInterviews: interviews.filter((i: InterviewPrisma) => i.status === 'in_progress').length,
      interruptedInterviews: interviews.filter((i: InterviewPrisma) => i.status === 'interrupted').length,
      averageScore: 0,
      byField: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      recentInterviews: 0
    };

    // Calculate average score
    const completedWithScores = interviews.filter((i: InterviewPrisma) => 
      i.status === 'completed' && 
      i.evaluation && 
      typeof i.evaluation === 'object' && 
      'overallRating' in i.evaluation
    );
    
    if (completedWithScores.length > 0) {
      const totalScore = completedWithScores.reduce((sum: number, interview: InterviewPrisma) => {
        const evaluation = interview.evaluation as { overallRating: number };
        return sum + (evaluation.overallRating || 0);
      }, 0);
      stats.averageScore = totalScore / completedWithScores.length;
    }

    // Group by field and level
    interviews.forEach((interview: InterviewPrisma) => {
      const fieldKey = interview.position.key.split('_')[0] || 'other';
      const levelKey = interview.position.level || 'unknown';
      
      stats.byField[fieldKey] = (stats.byField[fieldKey] || 0) + 1;
      stats.byLevel[levelKey] = (stats.byLevel[levelKey] || 0) + 1;
    });

    // Count recent interviews (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    stats.recentInterviews = interviews.filter((i: InterviewPrisma) => 
      new Date(i.startTime) >= weekAgo
    ).length;

    return withCORS(NextResponse.json({
      interviews,
      stats
    }));
  } catch (error) {
    console.error('Error in GET /api/interviews:', error);
    return withCORS(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
