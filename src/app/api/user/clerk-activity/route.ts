import { NextRequest, NextResponse } from "next/server";
import { ClerkActivityService } from "@/services/clerkActivityService";

export async function POST(request: NextRequest) {
  try {
    const { clerkId, setOffline, forceOnline } = await request.json();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "ClerkId is required" },
        { status: 400 }
      );
    }

    if (setOffline) {
      // Set user offline
      await ClerkActivityService.setUserOffline(clerkId);
      return NextResponse.json({ success: true, action: 'set_offline' });
    } else if (forceOnline) {
      // Force set user online
      await ClerkActivityService.forceSetUserOnline(clerkId);
      return NextResponse.json({ success: true, action: 'force_online' });
    } else {
      // Sync user session
      await ClerkActivityService.syncUserSession(clerkId);
      return NextResponse.json({ success: true, action: 'synced' });
    }
    
  } catch (error) {
    console.error("Error handling Clerk activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
