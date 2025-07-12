/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clerkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userActivityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('junior', 'mid', 'senior');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('completed', 'interrupted', 'in_progress');

-- CreateEnum
CREATE TYPE "InterviewMessageRole" AS ENUM ('user', 'ai', 'system');

-- CreateEnum
CREATE TYPE "HiringRecommendation" AS ENUM ('strong_hire', 'hire', 'consider', 'reject');

-- CreateEnum
CREATE TYPE "QuizLevel" AS ENUM ('junior', 'middle', 'senior');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('technical', 'behavioral');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('skill', 'interview', 'certification');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('interview', 'quiz', 'practice', 'learning', 'goal_completed', 'goal_started');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "name",
ADD COLUMN     "aboutMe" TEXT,
ADD COLUMN     "appliedJobs" TEXT[],
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "clerkId" TEXT NOT NULL,
ADD COLUMN     "clerkSessionActive" BOOLEAN DEFAULT false,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cvUrl" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "evaluations" JSONB,
ADD COLUMN     "experience" JSONB,
ADD COLUMN     "experienceLevel" "ExperienceLevel" DEFAULT 'mid',
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "interviewPractices" TEXT[],
ADD COLUMN     "interviewStats" JSONB,
ADD COLUMN     "isOnline" BOOLEAN DEFAULT false,
ADD COLUMN     "joinDate" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "lastActivity" TIMESTAMP(3),
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "lastSignInAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "preferredInterviewTypes" TEXT[],
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user',
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "status" TEXT DEFAULT 'Hoạt động',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "userActivityId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "conversationHistory" JSONB,
    "evaluation" JSONB,
    "questionCount" INTEGER,
    "coveredTopics" TEXT[],
    "skillAssessment" JSONB,
    "progress" INTEGER,
    "status" "InterviewStatus" NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" "QuizLevel" NOT NULL,
    "userAnswers" JSONB,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "timeUsed" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "retryCount" INTEGER DEFAULT 0,
    "quizHistoryUserId" TEXT,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answers" JSONB,
    "fields" TEXT[],
    "topics" TEXT[],
    "levels" "QuizLevel"[],
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "position" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalTime" INTEGER,
    "history" JSONB,
    "realTimeScores" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EQ" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "selectedCategory" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "history" JSONB,
    "realTimeScores" JSONB,
    "finalScores" JSONB,
    "totalTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "EQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activities" JSONB,
    "skills" JSONB,
    "goals" JSONB,
    "learningStats" JSONB,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "recommendations" TEXT[],
    "lastActive" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "progressHistory" JSONB,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
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

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QuizQuestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuizQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SavedQuestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SavedQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_QuizSavedQuestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuizSavedQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_key_key" ON "Position"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivity_userId_key" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "_QuizQuestions_B_index" ON "_QuizQuestions"("B");

-- CreateIndex
CREATE INDEX "_SavedQuestions_B_index" ON "_SavedQuestions"("B");

-- CreateIndex
CREATE INDEX "_QuizSavedQuestions_B_index" ON "_QuizSavedQuestions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userActivityId_key" ON "User"("userActivityId");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_quizHistoryUserId_fkey" FOREIGN KEY ("quizHistoryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuizQuestions" ADD CONSTRAINT "_QuizQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuizQuestions" ADD CONSTRAINT "_QuizQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedQuestions" ADD CONSTRAINT "_SavedQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedQuestions" ADD CONSTRAINT "_SavedQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuizSavedQuestions" ADD CONSTRAINT "_QuizSavedQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuizSavedQuestions" ADD CONSTRAINT "_QuizSavedQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
