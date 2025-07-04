import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

// API để invalidate role cache và test role refresh
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'refresh_all_roles') {
      // Trigger để clear cache ở client
      return NextResponse.json({
        message: "Role refresh triggered",
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({
      error: "Invalid action"
    }, { status: 400 });
    
  } catch (error) {
    console.error("Error in role cache API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Test endpoint để kiểm tra role distribution
    const users = await User.find().select('role');
    const roleCount = users.reduce((acc: Record<string, number>, user) => {
      acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      message: "Role statistics",
      roleDistribution: roleCount,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error("Error fetching role stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
