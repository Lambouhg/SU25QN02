import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Function to invalidate user list cache (shared with main route)
async function invalidateUserListCache() {
  try {
    // Make a request to the main user route to invalidate its cache
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/invalidate-cache`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Failed to invalidate user list cache:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate fullName from firstName and lastName
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
    
    return NextResponse.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      imageUrl: user.avatar, // Add imageUrl alias
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Tìm user trước khi cập nhật
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> & {
      updatedAt: Date;
    } = { ...body, updatedAt: new Date() };
    
    // Cập nhật user
    const user = await prisma.user.update({
      where: { clerkId: id },
      data: updateData
    });

    // Calculate fullName from updated user data
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;

    // Invalidate user list cache since user data was modified
    await invalidateUserListCache();

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        imageUrl: user.avatar // Add imageUrl alias
      }
    });
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Tìm và xóa user theo clerkId
    const user = await prisma.user.delete({
      where: { clerkId: id }
    });

    // Invalidate user list cache since user was deleted
    await invalidateUserListCache();

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUser: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null
      }
    });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // Check if user not found
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
