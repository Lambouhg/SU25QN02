import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    await connectDB();
    
    // Select specific fields including activity tracking fields
    const users = await User.find().select(
      'clerkId email firstName lastName fullName avatar role status lastLogin lastActivity lastSignInAt isOnline clerkSessionActive createdAt updatedAt'
    ).sort({ lastActivity: -1, lastLogin: -1 }); // Sort by most recent activity
    
    return NextResponse.json({
      success: true,
      users: users,
      totalCount: users.length
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, clerkId, avatar } = body;
    

    if (!email || !clerkId) {
      return NextResponse.json({ error: "Email and clerkId are required" }, { status: 400 });
    }
    
    await connectDB();

    // Kiểm tra user đã tồn tại với clerkId này
    const existingUserByClerkId = await User.findOne({ clerkId });
    

    if (existingUserByClerkId) {
     
      // Cập nhật lastLogin cho user đã tồn tại
      existingUserByClerkId.lastLogin = new Date();
      // Cập nhật thông tin nếu có thay đổi
      if (firstName) existingUserByClerkId.firstName = firstName;
      if (lastName) existingUserByClerkId.lastName = lastName;
      if (avatar) existingUserByClerkId.avatar = avatar;
      await existingUserByClerkId.save();
      
      return NextResponse.json({ 
        message: "User login recorded", 
        user: existingUserByClerkId,
        action: "login"
      });
    }

    // Kiểm tra xem email đã được sử dụng với clerkId khác
    const existingUserByEmail = await User.findOne({ email });
    
    if (existingUserByEmail) {
      // Có thể user đăng nhập bằng phương thức khác (OAuth vs email/password)
      // Trong trường hợp này, cập nhật clerkId mới nhất
      existingUserByEmail.clerkId = clerkId;
      existingUserByEmail.lastLogin = new Date();
      if (firstName) existingUserByEmail.firstName = firstName;
      if (lastName) existingUserByEmail.lastName = lastName;
      if (avatar) existingUserByEmail.avatar = avatar;
      await existingUserByEmail.save();
      
      return NextResponse.json({
        message: "Account linked successfully",
        user: existingUserByEmail,
        action: "link"
      });
    }

    // Tạo user mới nếu không tồn tại
    const newUser = await User.create({
      email,
      firstName,
      lastName,
      clerkId,
      avatar: avatar || '',
      lastLogin: new Date(),
    });

    return NextResponse.json({ 
      message: "User created successfully", 
      user: newUser,
      action: "signup"
    });
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
