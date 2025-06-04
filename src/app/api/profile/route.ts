import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const data = await request.json();

    await connectDB();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Update user profile
    user.name = data.fullName || user.name;
    if(data.currentPosition) user.currentPosition = data.currentPosition;
    if(data.experienceLevel) user.experienceLevel = data.experienceLevel;
    if(data.preferredInterviewTypes) user.preferredInterviewTypes = data.preferredInterviewTypes;
    
    await user.save();

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
