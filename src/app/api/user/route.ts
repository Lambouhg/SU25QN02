import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find();
    return NextResponse.json(users);
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
    const { email, firstName, lastName, clerkId } = body;
    

    if (!email || !clerkId) {
      console.log("Missing required fields:", { email: !!email, clerkId: !!clerkId });
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
      await existingUserByClerkId.save();
      
      return NextResponse.json({ 
        message: "User login recorded", 
        user: existingUserByClerkId,
        action: "login"
      });
    }

    // Kiểm tra xem email đã được sử dụng với clerkId khác
    const existingUserByEmail = await User.findOne({ email });
    console.log("Email already exists:", existingUserByEmail ? existingUserByEmail._id : "not found");
    
    if (existingUserByEmail) {
      console.log("Email conflict - email already registered with different clerkId");
      console.log("Existing email clerkId:", existingUserByEmail.clerkId);
      console.log("New clerkId:", clerkId);
      
      // Có thể user đăng nhập bằng phương thức khác (OAuth vs email/password)
      // Trong trường hợp này, cập nhật clerkId mới nhất
      console.log("Updating existing user with new clerkId (account linking)");
      existingUserByEmail.clerkId = clerkId;
      existingUserByEmail.lastLogin = new Date();
      if (firstName) existingUserByEmail.firstName = firstName;
      if (lastName) existingUserByEmail.lastName = lastName;
      await existingUserByEmail.save();
      
      return NextResponse.json({
        message: "Account linked successfully",
        user: existingUserByEmail,
        action: "link"
      });
    }

    // Tạo user mới nếu không tồn tại
    console.log("Creating new user...");
    const newUser = await User.create({
      email,
      firstName,
      lastName,
      clerkId,
      lastLogin: new Date(),
    });

    console.log("New user created:", newUser._id);
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
