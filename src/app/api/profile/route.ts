import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    // Try multiple approaches to get user
    let userId = null;
    let clerkUser = null;
    
    try {
      const { userId: authUserId } = await auth();
      userId = authUserId;
    } catch {}

    try {
      clerkUser = await currentUser();
      if (clerkUser && !userId) {
        userId = clerkUser.id;
      }
    } catch {}

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No user ID found from Clerk authentication' }, 
        { status: 401 }
      );
    }
    await connectDB();
    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist, create one with default values
    if (!user) {
      user = new User({
        clerkId: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
        name: clerkUser?.fullName || "",
        fullName: clerkUser?.fullName || "",
        phone: "",
        department: "",
        position: "",
        bio: "",
        skills: [],
        joinDate: new Date().toLocaleDateString('vi-VN'),
        lastLogin: "Hôm nay",
        status: "Hoạt động"
      });
      await user.save();
    }

    return NextResponse.json(user);

  } catch  {
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Try multiple approaches to get user ID
    let userId = null;
    
    try {
      const { userId: authUserId } = await auth();
      userId = authUserId;
    } catch {}
    
    if (!userId) {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          userId = clerkUser.id;
        }
      } catch {}
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const data = await request.json();

    await connectDB();
    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist, create one
    if (!user) {
      user = new User({
        clerkId: userId,
        name: data.fullName || "",
        email: data.email || "",
        fullName: data.fullName || "",
        phone: data.phone || "",
        department: data.department || "",
        position: data.position || "",
        bio: data.bio || "",
        skills: data.skills || [],
        joinDate: new Date().toLocaleDateString('vi-VN'),
        lastLogin: "Hôm nay",
        status: "Hoạt động"
      });
    } else {
      // Update existing user
      user.name = data.fullName || user.name;
      user.fullName = data.fullName || user.fullName;
      user.email = data.email || user.email;
      user.phone = data.phone || user.phone;
      user.department = data.department || user.department;
      user.position = data.position || user.position;
      user.bio = data.bio || user.bio;
      user.skills = data.skills || user.skills;
      user.lastLogin = "Hôm nay";
      
      // Keep existing fields for backward compatibility
      if(data.currentPosition) user.currentPosition = data.currentPosition;
      if(data.experienceLevel) user.experienceLevel = data.experienceLevel;
      if(data.preferredInterviewTypes) user.preferredInterviewTypes = data.preferredInterviewTypes;
    }
    
    await user.save();

    return NextResponse.json(user);

  } catch  {
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
