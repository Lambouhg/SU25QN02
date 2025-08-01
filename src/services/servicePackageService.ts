import { prisma } from '@/lib/prisma';
import type { ServicePackage, Prisma } from '@prisma/client';

export class ServicePackageService {
    // Get all active service packages
    static async getAllActive(): Promise<ServicePackage[]> {
        return await prisma.servicePackage.findMany({
            where: { isActive: true } as any,
            orderBy: { price: 'asc' }
        });
    }

    // Get all service packages (including inactive)
    static async getAll(): Promise<ServicePackage[]> {
        return await prisma.servicePackage.findMany({
            orderBy: { price: 'asc' }
        });
    }

    // Get service package by ID
    static async getById(id: string): Promise<ServicePackage | null> {
        return await prisma.servicePackage.findUnique({
            where: { id }
        });
    }

    // Create new service package
    static async create(data: Prisma.ServicePackageCreateInput): Promise<ServicePackage> {
        return await prisma.servicePackage.create({
            data
        });
    }

    // Update service package
    static async update(id: string, data: Prisma.ServicePackageUpdateInput): Promise<ServicePackage> {
        return await prisma.servicePackage.update({
            where: { id },
            data
        });
    }

    // Delete service package (soft delete by setting isActive to false)
    static async delete(id: string): Promise<ServicePackage> {
        // Check if any users are currently using this package
        const activeUsers = await prisma.userPackage.count({
            where: {
                servicePackageId: id,
                isActive: true
            }
        });

        if (activeUsers > 0) {
            throw new Error(`Cannot delete package: ${activeUsers} users are currently using it`);
        }

        return await prisma.servicePackage.update({
            where: { id },
            data: { isActive: false } as any
        });
    }

    // Hard delete service package
    static async hardDelete(id: string): Promise<ServicePackage> {
        // Check if any users are currently using this package
        const activeUsers = await prisma.userPackage.count({
            where: {
                servicePackageId: id,
                isActive: true
            }
        });

        if (activeUsers > 0) {
            throw new Error(`Cannot delete package: ${activeUsers} users are currently using it`);
        }

        return await prisma.servicePackage.delete({
            where: { id }
        });
    }

    // Get featured packages
    static async getFeatured(): Promise<ServicePackage[]> {
        return await prisma.servicePackage.findMany({
            where: {
                highlight: true,
                isActive: true
            } as any,
            orderBy: { price: 'asc' }
        });
    }

    // Get package statistics
    static async getStats() {
        const totalPackages = await prisma.servicePackage.count();
        const activePackages = await prisma.servicePackage.count({
            where: { isActive: true } as any
        });
        const featuredPackages = await prisma.servicePackage.count({
            where: { highlight: true, isActive: true } as any
        });

        return {
            totalPackages,
            activePackages,
            featuredPackages
        };
    }
} 