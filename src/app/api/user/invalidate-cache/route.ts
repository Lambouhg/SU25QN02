import { NextResponse } from "next/server";

// This endpoint is used to invalidate the user list cache from other routes
export async function POST() {
  try {
    // Import the invalidation function dynamically to avoid circular dependencies
    const userRoute = await import("../route");
    if (userRoute.invalidateUserListCache) {
      userRoute.invalidateUserListCache();
    }
    
    return NextResponse.json({
      success: true,
      message: "User list cache invalidated"
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
