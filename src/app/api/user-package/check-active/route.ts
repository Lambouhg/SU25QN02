import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Check if user has active package
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
            return NextResponse.json({
                hasActivePackage: false,
                message: 'User not found in database.'
            });
        }

        // Tìm gói active còn hạn
        const activePackage = await prisma.userPackage.findFirst({
            where: {
                userId: user.id,
                isActive: true,
                endDate: { gte: new Date() }
            },
            include: { servicePackage: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!activePackage) {
            return NextResponse.json({
                hasActivePackage: false,
                message: 'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn.'
            });
        }

        // Tính toán usage ratios
        const usage = {
            avatarInterview: `${activePackage.avatarInterviewUsed}/${activePackage.servicePackage.avatarInterviewLimit}`,
            testQuizEQ: `${activePackage.testQuizEQUsed}/${activePackage.servicePackage.testQuizEQLimit}`,
            jdUpload: `${activePackage.jdUploadUsed}/${activePackage.servicePackage.jdUploadLimit}`
        };

        // Kiểm tra còn hạn sử dụng không
        const canUseAvatarInterview = activePackage.avatarInterviewUsed < activePackage.servicePackage.avatarInterviewLimit;
        const canUseTestQuizEQ = activePackage.testQuizEQUsed < activePackage.servicePackage.testQuizEQLimit;
        const canUseJdUpload = activePackage.jdUploadUsed < activePackage.servicePackage.jdUploadLimit;

        return NextResponse.json({
            hasActivePackage: true,
            package: activePackage,
            usage,
            canUse: {
                avatarInterview: canUseAvatarInterview,
                testQuizEQ: canUseTestQuizEQ,
                jdUpload: canUseJdUpload
            },
            endDate: activePackage.endDate,
            daysRemaining: Math.ceil((new Date(activePackage.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        });
    } catch (error) {
        console.error('Error checking active package:', error);
        return NextResponse.json(
            { 
                error: 'Failed to check active package',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 