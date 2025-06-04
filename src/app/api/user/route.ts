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
    const { email, firstName, lastName, clerkId } = body;    if (!email || !clerkId) {
      return NextResponse.json({ error: "Email and clerkId are required" }, { status: 400 });
    }
      await connectDB();    // Kiểm tra user đã tồn tại với clerkId này
    const existingUser = await User.findOne({ clerkId });    if (existingUser) {
      // Nếu user đã tồn tại, trả về user đó mà không cập nhật gì
      return NextResponse.json(existingUser);
    }    // Kiểm tra xem email đã được sử dụng chưa trước khi tạo user mới
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // Tạo user mới nếu email chưa được sử dụng
    const newUser = await User.create({
      email,
      firstName,
      lastName,
      clerkId,
      lastLogin: new Date(),
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
