import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// PATCH /api/admin/packages/[id] - Update package (chỉ admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra quyền admin
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const {
      name,
      price,
      duration,
      avatarInterviewLimit,
      testQuizEQLimit,
      jdUploadLimit,
      description,
      isActive
    } = body;

    // Kiểm tra package có tồn tại không
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Kiểm tra package name đã tồn tại chưa (nếu thay đổi name)
    if (name && name !== existingPackage.name) {
      const duplicatePackage = await prisma.servicePackage.findFirst({
        where: { 
          name,
          id: { not: id } // Loại trừ package hiện tại
        }
      });

      if (duplicatePackage) {
        return NextResponse.json(
          { error: 'Package name already exists' },
          { status: 409 }
        );
      }
    }

    // Update package
    const updatedPackage = await prisma.servicePackage.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price }),
        ...(duration !== undefined && { duration }),
        ...(avatarInterviewLimit !== undefined && { avatarInterviewLimit }),
        ...(testQuizEQLimit !== undefined && { testQuizEQLimit }),
        ...(jdUploadLimit !== undefined && { jdUploadLimit }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      package: updatedPackage,
      message: 'Package updated successfully'
    });

  } catch (error) {
    console.error('Error updating service package:', error);
    return NextResponse.json(
      { error: 'Failed to update service package' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/packages/[id] - Delete package (chỉ admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra quyền admin
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Kiểm tra package có tồn tại không
    const existingPackage = await prisma.servicePackage.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Kiểm tra xem package có đang được sử dụng bởi user nào không
    const userPackages = await prisma.userPackage.findMany({
      where: { servicePackageId: id }
    });

    if (userPackages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package: Package is currently in use by users' },
        { status: 400 }
      );
    }

    // Delete package
    await prisma.servicePackage.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service package:', error);
    return NextResponse.json(
      { error: 'Failed to delete service package' },
      { status: 500 }
    );
  }
}
