-- AlterEnum
-- Thêm 'test' và 'eq' vào enum ActivityType
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'test';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'eq';
