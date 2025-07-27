import { prisma } from '@/lib/prisma';
import type { UserPackage, Prisma } from '@prisma/client';

export class UserPackageService {
    // Get all user packages for a specific user
    static async getByUserId(userId: string) {
        return await prisma.userPackage.findMany({
            where: { userId },
            include: { servicePackage: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get active user packages for a specific user
    static async getActiveByUserId(userId: string) {
        return await prisma.userPackage.findMany({
            where: {
                userId,
                isActive: true
            },
            include: { servicePackage: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get user package by ID
    static async getById(id: string) {
        return await prisma.userPackage.findUnique({
            where: { id },
            include: { servicePackage: true }
        });
    }

    // Create new user package
    static async create(data: any) {
        return await prisma.userPackage.create({
            data,
            include: { servicePackage: true }
        });
    }

    // Update user package
    static async update(id: string, data: any) {
        // Validate usage limits
        if (data.avatarInterviewUsed !== undefined || data.testQuizEQUsed !== undefined || data.jdUploadUsed !== undefined) {
            const currentPackage = await this.getById(id);
            if (!currentPackage) {
                throw new Error('User package not found');
            }

            const { servicePackage } = currentPackage;

            if (data.avatarInterviewUsed !== undefined && data.avatarInterviewUsed > servicePackage.avatarInterviewLimit) {
                throw new Error(`Avatar interview usage cannot exceed ${servicePackage.avatarInterviewLimit}`);
            }

            if (data.testQuizEQUsed !== undefined && data.testQuizEQUsed > servicePackage.testQuizEQLimit) {
                throw new Error(`Test quiz EQ usage cannot exceed ${servicePackage.testQuizEQLimit}`);
            }

            if (data.jdUploadUsed !== undefined && data.jdUploadUsed > servicePackage.jdUploadLimit) {
                throw new Error(`JD upload usage cannot exceed ${servicePackage.jdUploadLimit}`);
            }
        }

        return await prisma.userPackage.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: { servicePackage: true }
        });
    }

    // Delete user package
    static async delete(id: string): Promise<UserPackage> {
        const userPackage = await prisma.userPackage.findUnique({
            where: { id },
            include: { servicePackage: true }
        });

        if (!userPackage) {
            throw new Error('User package not found');
        }

        // Check if package is still active and not expired
        if (userPackage.isActive && new Date() <= userPackage.endDate) {
            throw new Error('Cannot delete active package. Please deactivate it first.');
        }

        return await prisma.userPackage.delete({
            where: { id }
        });
    }

    // Increment usage for a specific service
    static async incrementUsage(id: string, serviceType: 'avatarInterview' | 'testQuizEQ' | 'jdUpload') {
        const userPackage = await this.getById(id);
        if (!userPackage) {
            throw new Error('User package not found');
        }

        const { servicePackage } = userPackage as any;
        const currentUsage = (userPackage as any)[`${serviceType}Used`] as number;
        const limit = (servicePackage as any)[`${serviceType}Limit`] as number;

        if (currentUsage >= limit) {
            throw new Error(`${serviceType} usage limit reached`);
        }

        const updateData: any = {};
        updateData[`${serviceType}Used`] = currentUsage + 1;

        return await this.update(id, updateData);
    }

    // Check if user can use a specific service
    static async canUseService(userId: string, serviceType: 'avatarInterview' | 'testQuizEQ' | 'jdUpload'): Promise<boolean> {
        const activePackages = await this.getActiveByUserId(userId);

        for (const userPackage of activePackages) {
            const currentUsage = userPackage[`${serviceType}Used` as keyof UserPackage] as number;
            const limit = userPackage.servicePackage[`${serviceType}Limit` as keyof typeof userPackage.servicePackage] as number;

            if (currentUsage < limit && new Date() <= userPackage.endDate) {
                return true;
            }
        }

        return false;
    }

    // Get user package statistics
    static async getStats(userId: string) {
        const allPackages = await this.getByUserId(userId);
        const activePackages = allPackages.filter(pkg => pkg.isActive && new Date() <= pkg.endDate);

        const totalAvatarInterviews = allPackages.reduce((sum, pkg) => sum + pkg.avatarInterviewUsed, 0);
        const totalTestQuizEQ = allPackages.reduce((sum, pkg) => sum + pkg.testQuizEQUsed, 0);
        const totalJdUploads = allPackages.reduce((sum, pkg) => sum + pkg.jdUploadUsed, 0);

        return {
            totalPackages: allPackages.length,
            activePackages: activePackages.length,
            totalAvatarInterviews,
            totalTestQuizEQ,
            totalJdUploads
        };
    }
} 