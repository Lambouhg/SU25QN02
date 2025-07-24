import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

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
    
    // Tìm user theo email hoặc clerkId
    const where = email ? { email } : { clerkId };
    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update role thành admin
    const updatedUser = await prisma.user.update({
      where,
      data: {
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    return NextResponse.json({
      message: "User has been granted admin privileges",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        role: updatedUser.role
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
    // Lấy danh sách tất cả admin
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });
    
    const adminsWithFullName = admins.map((admin: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      createdAt: Date;
    }) => ({
      ...admin,
      fullName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
    }));
    
    return NextResponse.json({
      message: "List of all admins",
      admins: adminsWithFullName,
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
