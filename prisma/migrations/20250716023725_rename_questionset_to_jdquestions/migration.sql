/*
  Warnings:

  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EQ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionSet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('test', 'eq');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fullName";

-- DropTable
DROP TABLE "EQ";

-- DropTable
DROP TABLE "QuestionSet";

-- DropTable
DROP TABLE "Test";

-- CreateTable
CREATE TABLE "JdQuestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "level" "ExperienceLevel" NOT NULL,
    "questions" TEXT[],
    "originalJDText" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "JdQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "positionId" TEXT,
    "selectedCategory" TEXT,
    "level" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "history" JSONB,
    "realTimeScores" JSONB,
    "finalScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_positionId_idx" ON "Assessment"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
