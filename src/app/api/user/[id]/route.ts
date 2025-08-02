import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { invalidateUserListCache } from "@/lib/userCache";

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
    
    // Tìm user trước khi xóa để lấy thông tin
    const user = await prisma.user.findUnique({
      where: { clerkId: id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Xóa user từ Clerk trước
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(id);
      console.log(`Successfully deleted user from Clerk: ${id}`);
    } catch (clerkError) {
      console.error("Error deleting user from Clerk:", clerkError);
      // Tiếp tục xóa từ database ngay cả khi Clerk fail
      // vì có thể user đã bị xóa từ Clerk rồi
    }

    // Xóa tất cả dữ liệu liên quan từ database
    await prisma.$transaction(async (tx) => {
      // Xóa UserActivity trước (nếu có)
      await tx.userActivity.deleteMany({
        where: { userId: user.id }
      });

      // Xóa Quiz records liên quan đến user
      await tx.quiz.deleteMany({
        where: { userId: user.id }
      });

      // Xóa JdQuestions
      await tx.jdQuestions.deleteMany({
        where: { userId: user.id }
      });

      // Xóa UserPackage
      await tx.userPackage.deleteMany({
        where: { userId: user.id }
      });

      // Xóa PaymentHistory records
      await tx.paymentHistory.deleteMany({
        where: { userId: user.id }
      });

      // Xóa Interview records
      await tx.interview.deleteMany({
        where: { userId: user.id }
      });

      // Xóa user từ database (cuối cùng)
      await tx.user.delete({
        where: { clerkId: id }
      });
    });

    // Invalidate user list cache since user was deleted
    invalidateUserListCache();

    return NextResponse.json({
      message: "User deleted successfully from both Clerk and database",
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
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
