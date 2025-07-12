import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST() {
  try {
    await connectDB();
    
    // Find all users
    const users = await User.find();
    
    let updated = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Fix fullName if it's missing or empty
      if (!user.fullName && (user.firstName || user.lastName)) {
        user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        needsUpdate = true;
      }
      
      // If user has no avatar but has a default, set it
      if (!user.avatar) {
        user.avatar = '';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        updated++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} users`,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error("Error fixing users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
