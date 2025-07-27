import { ServicePackage } from './servicePackage';

export interface UserPackage {
    id: string;
    userId: string;
    servicePackageId: string;
    startDate: Date;
    endDate: Date;
    avatarInterviewUsed: number;
    testQuizEQUsed: number;
    jdUploadUsed: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPackageWithServicePackage extends UserPackage {
    servicePackage: ServicePackage;
}

export interface CreateUserPackageInput {
    userId: string;
    servicePackageId: string;
    startDate?: Date;
    endDate?: Date;
    avatarInterviewUsed?: number;
    testQuizEQUsed?: number;
    jdUploadUsed?: number;
    isActive?: boolean;
}

export interface UpdateUserPackageInput {
    avatarInterviewUsed?: number;
    testQuizEQUsed?: number;
    jdUploadUsed?: number;
    isActive?: boolean;
}

export interface UserPackageUsage {
    avatarInterview: string; // "used/limit"
    testQuizEQ: string; // "used/limit"
    jdUpload: string; // "used/limit"
}

export interface UserPackageWithUsage extends UserPackageWithServicePackage {
    usage: UserPackageUsage;
} 