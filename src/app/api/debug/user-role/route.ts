import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

// Rate limiting cache for debug endpoint
const debugRateLimit = new Map<string, number>();
const RATE_LIMIT_DURATION = 5000; // 5 seconds

export async function GET() {
  try {
    // Get current user from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({
        error: "No authenticated user found",
        clerkUser: null,
        dbUser: null,
        role: null
      });
    }

    // Rate limiting - prevent too frequent calls
    const now = Date.now();
    const lastRequest = debugRateLimit.get(clerkUser.id);
    
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_DURATION) {
      return NextResponse.json({
        error: "Rate limited",
        message: "Please wait before making another request",
        role: "rate_limited"
      }, { status: 429 });
    }
    
    debugRateLimit.set(clerkUser.id, now);

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
      role: dbUser?.role || null,
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
