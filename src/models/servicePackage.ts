export interface ServicePackage {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    avatarInterviewLimit: number;
    testQuizEQLimit: number;
    jdUploadLimit: number;
    highlight: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServicePackageInput {
    name: string;
    description?: string;
    price: number;
    duration: number;
    avatarInterviewLimit?: number;
    testQuizEQLimit?: number;
    jdUploadLimit?: number;
    highlight?: boolean;
    isActive?: boolean;
}

export interface UpdateServicePackageInput {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    avatarInterviewLimit?: number;
    testQuizEQLimit?: number;
    jdUploadLimit?: number;
    highlight?: boolean;
    isActive?: boolean;
}

export interface ServicePackageWithUserCount extends ServicePackage {
    _count?: {
        userPackages: number;
    };
} 