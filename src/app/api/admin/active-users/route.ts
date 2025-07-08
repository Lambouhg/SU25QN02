import { NextResponse } from "next/server";
import { ClerkActivityService } from "@/services/clerkActivityService";

export async function GET() {
  try {
    // Cleanup inactive sessions trước khi lấy data
    await ClerkActivityService.cleanupInactiveSessions();
    
    // Lấy active users data từ Clerk service
    const activeUsersData = await ClerkActivityService.getActiveUsers();
    
    return NextResponse.json(activeUsersData);
    
  } catch (error) {
    console.error("Error fetching active users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
