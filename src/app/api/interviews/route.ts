import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Interview from '@/models/interview';
import User from '@/models/user';
import { auth, currentUser } from '@clerk/nextjs/server';

interface MongoError {
  message: string;
  code?: number;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get the auth details
    const [session, user] = await Promise.all([
      auth(),
      currentUser()
    ]);
    
    const clerkId = session?.userId;
    
    // Log auth details for debugging
    console.log('Auth check:', { 
      sessionUserId: session?.userId,
      userIdFromClerk: user?.id,
      hasSession: !!session,
      hasUser: !!user 
    });
    
    if (!clerkId || !user) {
      console.error('Auth failed:', {
        clerkId,
        hasUser: !!user,
        headers: Object.fromEntries(req.headers.entries())
      });
      return NextResponse.json(
        { error: 'Unauthorized - No valid session found', details: { hasClerkId: !!clerkId, hasUser: !!user } },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find user based on clerkId
    let dbUser = await User.findOne({ clerkId });
    console.log('Found user in DB:', { clerkId, userId: dbUser?._id });
    
    if (!dbUser) {
      // If no user found, create one with Clerk user details
      try {
        dbUser = await User.create({
          clerkId,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: new Date(),
        });
        console.log('Created new user:', { clerkId, userId: dbUser._id });
      } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: 'Failed to create user profile', details: (error as Error).message },
          { status: 500 }
        );
      }
    }    // Get request data
    const data = await req.json();
    console.log('Received interview data:', { clerkId, field: data.interviewField });

    // Structure interview data according to the new model
    const interviewData = {
      userId: dbUser._id,
      interviewField: data.interviewField,
      interviewLevel: data.interviewLevel,
      language: data.language,
      startTime: data.startTime || new Date(),
      endTime: data.endTime || new Date(),
      conversationHistory: data.conversationHistory || [],
      evaluation: data.evaluation || {
        technicalScore: 0,
        communicationScore: 0,
        problemSolvingScore: 0,
        cultureFitScore: 0,
        overallRating: 0,
        technicalStrengths: [],
        technicalWeaknesses: [],
        recommendations: [],
        hiringRecommendation: 'consider',
        detailedFeedback: {
          technical: '',
          softSkills: '',
          experience: '',
          potential: ''
        }
      },
      avatarConfig: data.avatarConfig,
      questionCount: data.questionCount || 0,
      coveredTopics: data.coveredTopics || [],
      skillAssessment: data.skillAssessment || {
        technical: 0,
        communication: 0,
        problemSolving: 0
      },
      progress: data.progress || 0,
      status: data.status || 'in-progress'
    };
    
    // Create new interview
    const newInterview = await Interview.create(interviewData);
    console.log('Created interview:', { interviewId: newInterview._id });

    // Update user's interview stats
    await User.findByIdAndUpdate(dbUser._id, {
      $push: { interviewPractices: newInterview._id },
      $inc: { 
        'interviewStats.totalInterviews': 1,
        [`interviewStats.${interviewData.interviewField}Interviews`]: 1
      }
    });

    return NextResponse.json(newInterview, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/interviews:', error);
    const mongoError = error as MongoError;
    
    if (mongoError.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate interview entry' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: mongoError.message },
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

    await connectDB();
    
    // Find user by clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get interviews for the user
    const interviews = await Interview.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error in GET /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
