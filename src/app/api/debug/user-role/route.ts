import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({
        error: "No authenticated user found",
        clerkUser: null,
        dbUser: null
      });
    }

    // Connect to database
    await connectDB();
    
    // Find user in database
    const dbUser = await User.findOne({ clerkId: clerkUser.id });
    
    return NextResponse.json({
      clerkUser: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      },
      dbUser: dbUser ? {
        _id: dbUser._id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        status: dbUser.status,
        createdAt: dbUser.createdAt
      } : null,
      message: dbUser ? "User found in database" : "User not found in database"
    });
    
  } catch (error) {
    console.error("Debug user role error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
