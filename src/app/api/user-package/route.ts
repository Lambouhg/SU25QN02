import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Get user packages for current user
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Tìm user trong database
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            // Thử tìm theo clerkId
            user = await prisma.user.findFirst({
                where: { clerkId: userId }
            });
        }

        if (!user) {
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

        const userPackages = await prisma.userPackage.findMany({
            where: { userId: user.id },
            include: { servicePackage: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(userPackages);
    } catch (error) {
        console.error('Error fetching user packages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user packages' },
            { status: 500 }
        );
    }
}

// POST - Purchase a new package
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { servicePackageId } = body;

        if (!servicePackageId) {
            return NextResponse.json(
                { error: 'Service package ID is required' },
                { status: 400 }
            );
        }

        // Tìm user trong database
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            // Thử tìm theo clerkId
            user = await prisma.user.findFirst({
                where: { clerkId: userId }
            });
        }

        if (!user) {
            // Auto-create user if not exists
            try {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        email: '', // Will be updated later
                        clerkId: userId,
                        firstName: '',
                        lastName: '',
                        role: 'user'
                    }
                });
            } catch (createError) {
                console.error('Error auto-creating user:', createError);
                return NextResponse.json(
                    { error: 'Failed to create user account. Please try again.' },
                    { status: 500 }
                );
            }
        }

        // Check if user already has any active package
        const existingActivePackage = await prisma.userPackage.findFirst({
            where: {
                userId: user.id,
                isActive: true,
                endDate: { gte: new Date() }
            },
            include: { servicePackage: true }
        });

        if (existingActivePackage) {
            // Nếu gói mới khác gói cũ, thực hiện nâng cấp
            if (existingActivePackage.servicePackageId !== servicePackageId) {
                // Deactivate gói cũ
                await prisma.userPackage.update({
                    where: { id: existingActivePackage.id },
                    data: { isActive: false }
                });
                // Có thể lưu lịch sử nâng cấp tại đây nếu cần
            } else {
                return NextResponse.json(
                    { error: 'You already have an active package of this type' },
                    { status: 409 }
                );
            }
        }



        // Get service package details
        const servicePackage = await prisma.servicePackage.findUnique({
            where: { id: servicePackageId }
        });

        if (!servicePackage) {
            return NextResponse.json(
                { error: 'Service package not found' },
                { status: 404 }
            );
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + servicePackage.duration * 24 * 60 * 60 * 1000);

        const newUserPackage = await prisma.userPackage.create({
            data: {
                userId: user.id,
                servicePackageId,
                startDate,
                endDate,
                avatarInterviewUsed: 0,
                testQuizEQUsed: 0,
                jdUploadUsed: 0,
                isActive: true
            },
            include: { servicePackage: true }
        });

        return NextResponse.json(newUserPackage, { status: 201 });
    } catch (error) {
        console.error('Error creating user package:', error);
        return NextResponse.json(
            {
                error: 'Failed to create user package',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH - Update user package usage
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id, avatarInterviewUsed, testQuizEQUsed, jdUploadUsed, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'User package ID is required' },
                { status: 400 }
            );
        }

        // Get current package to validate limits
        const currentPackage = await prisma.userPackage.findUnique({
            where: { id },
            include: { servicePackage: true }
        });

        if (!currentPackage) {
            return NextResponse.json(
                { error: 'User package not found' },
                { status: 404 }
            );
        }

        // Validate usage limits
        if (avatarInterviewUsed !== undefined && avatarInterviewUsed > currentPackage.servicePackage.avatarInterviewLimit) {
            return NextResponse.json(
                { error: `Avatar interview usage cannot exceed ${currentPackage.servicePackage.avatarInterviewLimit}` },
                { status: 400 }
            );
        }

        if (testQuizEQUsed !== undefined && testQuizEQUsed > currentPackage.servicePackage.testQuizEQLimit) {
            return NextResponse.json(
                { error: `Test quiz EQ usage cannot exceed ${currentPackage.servicePackage.testQuizEQLimit}` },
                { status: 400 }
            );
        }

        if (jdUploadUsed !== undefined && jdUploadUsed > currentPackage.servicePackage.jdUploadLimit) {
            return NextResponse.json(
                { error: `JD upload usage cannot exceed ${currentPackage.servicePackage.jdUploadLimit}` },
                { status: 400 }
            );
        }

        const updatedPackage = await prisma.userPackage.update({
            where: { id },
            data: {
                avatarInterviewUsed,
                testQuizEQUsed,
                jdUploadUsed,
                isActive,
                updatedAt: new Date()
            },
            include: { servicePackage: true }
        });

        // Add usage ratios to response
        const response = {
            ...updatedPackage,
            usage: {
                avatarInterview: `${updatedPackage.avatarInterviewUsed}/${updatedPackage.servicePackage.avatarInterviewLimit}`,
                testQuizEQ: `${updatedPackage.testQuizEQUsed}/${updatedPackage.servicePackage.testQuizEQLimit}`,
                jdUpload: `${updatedPackage.jdUploadUsed}/${updatedPackage.servicePackage.jdUploadLimit}`
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating user package:', error);
        return NextResponse.json(
            { error: 'Failed to update user package' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user package
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'User package ID is required' },
                { status: 400 }
            );
        }

        const userPackage = await prisma.userPackage.findUnique({
            where: { id },
            include: { servicePackage: true }
        });

        if (!userPackage) {
            return NextResponse.json(
                { error: 'User package not found' },
                { status: 404 }
            );
        }

        // Check if package is still active and not expired
        if (userPackage.isActive && new Date() <= userPackage.endDate) {
            return NextResponse.json(
                { error: 'Cannot delete active package. Please deactivate it first.' },
                { status: 409 }
            );
        }

        const deletedPackage = await prisma.userPackage.delete({
            where: { id },
            include: { servicePackage: true }
        });

        return NextResponse.json({
            message: 'User package deleted successfully',
            deletedPackage
        });
    } catch (error) {
        console.error('Error deleting user package:', error);
        return NextResponse.json(
            { error: 'Failed to delete user package' },
            { status: 500 }
        );
    }
} 