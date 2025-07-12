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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "avatar" TEXT,
    "location" TEXT,
    "aboutMe" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "joinDate" TEXT,
    "status" TEXT DEFAULT 'Hoạt động',
    "experienceLevel" "ExperienceLevel" DEFAULT 'mid',
    "preferredInterviewTypes" TEXT[],
    "cvUrl" TEXT,
    "socialLinks" JSONB,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "companyId" TEXT,
    "skills" TEXT[],
    "appliedJobs" TEXT[],
    "interviewPractices" TEXT[],
    "interviewStats" JSONB,
    "experience" JSONB,
    "education" JSONB,
    "languages" TEXT[],
    "evaluations" JSONB,
    "lastLogin" TIMESTAMP(3),
    "lastSignInAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "clerkSessionActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userActivityId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "conversationHistory" JSONB NOT NULL,
    "evaluation" JSONB NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "coveredTopics" TEXT[],
    "skillAssessment" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
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
    "positionName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userActivityId_key" ON "User"("userActivityId");

-- CreateIndex
CREATE INDEX "Interview_userId_idx" ON "Interview"("userId");

-- CreateIndex
CREATE INDEX "Interview_positionId_idx" ON "Interview"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_key_key" ON "Position"("key");

-- CreateIndex
CREATE INDEX "Position_key_idx" ON "Position"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivity_userId_key" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "_QuizQuestions_B_index" ON "_QuizQuestions"("B");

-- CreateIndex
CREATE INDEX "_SavedQuestions_B_index" ON "_SavedQuestions"("B");

-- CreateIndex
CREATE INDEX "_QuizSavedQuestions_B_index" ON "_QuizSavedQuestions"("B");

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
