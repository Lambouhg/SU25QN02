import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, clerkId } = body;
    
    if (!email && !clerkId) {
      return NextResponse.json(
        { error: "Email or clerkId is required" },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Tìm user theo email hoặc clerkId
    const query = email ? { email } : { clerkId };
    const user = await User.findOne(query);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update role thành admin
    user.role = 'admin';
    await user.save();

    return NextResponse.json({
      message: "User has been granted admin privileges",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("Error updating user to admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Lấy danh sách tất cả admin
    const admins = await User.find({ role: 'admin' }).select('email fullName firstName lastName role createdAt');
    
    return NextResponse.json({
      message: "List of all admins",
      admins,
      count: admins.length
    });
    
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
