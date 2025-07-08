import { NextResponse } from "next/server";
import { ClerkActivityService } from "@/services/clerkActivityService";

export async function GET() {
  try {
    // Cleanup inactive sessions trước khi lấy data
    await ClerkActivityService.cleanupInactiveSessions();
    
    const onlineUsers = await ClerkActivityService.getOnlineUsersList(20);
    
    // Trả về object với format component expect
    return NextResponse.json({
      users: onlineUsers,
      timestamp: new Date().toISOString(),
      count: onlineUsers.length
    });
    
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json(
      { error: "Internal server error", users: [], timestamp: new Date().toISOString(), count: 0 },
      { status: 500 }
    );
  }
}
