-- CreateEnum
CREATE TYPE "public"."ExperienceLevel" AS ENUM ('junior', 'mid', 'senior');

-- CreateEnum
CREATE TYPE "public"."InterviewStatus" AS ENUM ('completed', 'interrupted', 'in_progress');

-- CreateEnum
CREATE TYPE "public"."InterviewMessageRole" AS ENUM ('user', 'ai', 'system');

-- CreateEnum
CREATE TYPE "public"."HiringRecommendation" AS ENUM ('strong_hire', 'hire', 'consider', 'reject');

-- CreateEnum
CREATE TYPE "public"."QuizLevel" AS ENUM ('junior', 'middle', 'senior');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('technical', 'behavioral');

-- CreateEnum
CREATE TYPE "public"."QuestionItemType" AS ENUM ('single_choice', 'multiple_choice', 'free_text', 'scale', 'coding');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "public"."GoalType" AS ENUM ('skill', 'interview', 'certification');

-- CreateEnum
CREATE TYPE "public"."SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('interview', 'quiz', 'practice', 'learning', 'goal_completed', 'goal_started', 'jd', 'assessment');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('test', 'eq');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'success', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."AssessmentStatus" AS ENUM ('in_progress', 'completed');

-- CreateEnum
CREATE TYPE "public"."JobLevel" AS ENUM ('Intern', 'Junior', 'Mid', 'Senior', 'Lead');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "joinDate" TEXT,
    "status" TEXT DEFAULT 'Hoạt động',
    "experienceLevel" "public"."ExperienceLevel" DEFAULT 'mid',
    "roleId" TEXT NOT NULL DEFAULT 'user_role_id',
    "skills" TEXT[],
    "lastLogin" TIMESTAMP(3),
    "lastSignInAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "clerkSessionActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preferredJobRoleId" TEXT,
    "preferredLanguage" TEXT DEFAULT 'vi',
    "interviewPreferences" JSONB,
    "autoStartWithPreferences" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobRoleId" TEXT NOT NULL,
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
    "status" "public"."InterviewStatus" NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionItem" (
    "id" TEXT NOT NULL,
    "type" "public"."QuestionItemType" NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "level" "public"."QuizLevel",
    "topics" TEXT[],
    "fields" TEXT[],
    "skills" TEXT[],
    "difficulty" DOUBLE PRECISION,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT,
    "level" "public"."QuizLevel",
    "topics" TEXT[],
    "fields" TEXT[],
    "skills" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionSetQuestion" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionSetQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizAttempt" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeUsed" INTEGER,
    "score" DOUBLE PRECISION,
    "sectionScores" JSONB,
    "itemsSnapshot" JSONB NOT NULL,
    "responses" JSONB,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JdQuestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "questionType" "public"."QuestionType" NOT NULL,
    "level" "public"."ExperienceLevel" NOT NULL,
    "questions" TEXT[],
    "originalJDText" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "JdQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JdAnswers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jdQuestionSetId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "feedback" TEXT,
    "scores" JSONB,
    "overallScore" DOUBLE PRECISION,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "skillAssessment" JSONB,
    "timeSpent" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JdAnswers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."AssessmentType" NOT NULL,
    "jobRoleId" TEXT,
    "selectedCategory" TEXT,
    "level" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "history" JSONB,
    "realTimeScores" JSONB,
    "finalScores" JSONB,
    "status" "public"."AssessmentStatus" NOT NULL DEFAULT 'in_progress',
    "overallFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "avatarInterviewLimit" INTEGER NOT NULL DEFAULT 0,
    "testQuizEQLimit" INTEGER NOT NULL DEFAULT 0,
    "jdUploadLimit" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPackage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "servicePackageId" TEXT NOT NULL,
    "orderCode" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "avatarInterviewUsed" INTEGER NOT NULL DEFAULT 0,
    "testQuizEQUsed" INTEGER NOT NULL DEFAULT 0,
    "jdUploadUsed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "servicePackageId" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "refundAmount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "checkoutUrl" TEXT,
    "qrCode" TEXT,
    "returnUrl" TEXT,
    "cancelUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "feature" TEXT,
    "action" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "duration" INTEGER,
    "referenceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "skillDeltas" JSONB,

    CONSTRAINT "UserActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDailyStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "activityTypeBreakdown" JSONB,
    "skillAverages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSkillSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" "public"."ActivityType",
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkillSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skills" TEXT[],

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobSpecialization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "JobSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "public"."JobLevel" NOT NULL,
    "description" TEXT,
    "minExperience" INTEGER NOT NULL DEFAULT 0,
    "maxExperience" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "specializationId" TEXT,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_SavedQuestionItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SavedQuestionItems_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Role_isActive_idx" ON "public"."Role"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_name_idx" ON "public"."Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "public"."Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_isActive_idx" ON "public"."Permission"("isActive");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "public"."RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "public"."RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "public"."RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "public"."User"("roleId");

-- CreateIndex
CREATE INDEX "Interview_userId_idx" ON "public"."Interview"("userId");

-- CreateIndex
CREATE INDEX "Interview_jobRoleId_idx" ON "public"."Interview"("jobRoleId");

-- CreateIndex
CREATE INDEX "QuestionSetQuestion_questionSetId_idx" ON "public"."QuestionSetQuestion"("questionSetId");

-- CreateIndex
CREATE INDEX "QuestionSetQuestion_questionId_idx" ON "public"."QuestionSetQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetQuestion_questionSetId_questionId_key" ON "public"."QuestionSetQuestion"("questionSetId", "questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "public"."QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_questionSetId_idx" ON "public"."QuizAttempt"("questionSetId");

-- CreateIndex
CREATE INDEX "JdAnswers_userId_idx" ON "public"."JdAnswers"("userId");

-- CreateIndex
CREATE INDEX "JdAnswers_jdQuestionSetId_idx" ON "public"."JdAnswers"("jdQuestionSetId");

-- CreateIndex
CREATE INDEX "JdAnswers_answeredAt_idx" ON "public"."JdAnswers"("answeredAt");

-- CreateIndex
CREATE INDEX "Assessment_jobRoleId_idx" ON "public"."Assessment"("jobRoleId");

-- CreateIndex
CREATE INDEX "ServicePackage_name_idx" ON "public"."ServicePackage"("name");

-- CreateIndex
CREATE INDEX "ServicePackage_price_idx" ON "public"."ServicePackage"("price");

-- CreateIndex
CREATE UNIQUE INDEX "UserPackage_orderCode_key" ON "public"."UserPackage"("orderCode");

-- CreateIndex
CREATE INDEX "UserPackage_userId_idx" ON "public"."UserPackage"("userId");

-- CreateIndex
CREATE INDEX "UserPackage_servicePackageId_idx" ON "public"."UserPackage"("servicePackageId");

-- CreateIndex
CREATE INDEX "UserPackage_isActive_idx" ON "public"."UserPackage"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserPackage_userId_servicePackageId_key" ON "public"."UserPackage"("userId", "servicePackageId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentHistory_orderCode_key" ON "public"."PaymentHistory"("orderCode");

-- CreateIndex
CREATE INDEX "PaymentHistory_userId_idx" ON "public"."PaymentHistory"("userId");

-- CreateIndex
CREATE INDEX "PaymentHistory_servicePackageId_idx" ON "public"."PaymentHistory"("servicePackageId");

-- CreateIndex
CREATE INDEX "PaymentHistory_status_idx" ON "public"."PaymentHistory"("status");

-- CreateIndex
CREATE INDEX "PaymentHistory_orderCode_idx" ON "public"."PaymentHistory"("orderCode");

-- CreateIndex
CREATE INDEX "UserActivityEvent_userId_timestamp_idx" ON "public"."UserActivityEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "UserActivityEvent_activityType_timestamp_idx" ON "public"."UserActivityEvent"("activityType", "timestamp");

-- CreateIndex
CREATE INDEX "UserActivityEvent_referenceId_idx" ON "public"."UserActivityEvent"("referenceId");

-- CreateIndex
CREATE INDEX "UserDailyStats_userId_date_idx" ON "public"."UserDailyStats"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyStats_userId_date_key" ON "public"."UserDailyStats"("userId", "date");

-- CreateIndex
CREATE INDEX "UserSkillSnapshot_userId_skillName_createdAt_idx" ON "public"."UserSkillSnapshot"("userId", "skillName", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_name_key" ON "public"."JobCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobSpecialization_name_key" ON "public"."JobSpecialization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobRole_key_key" ON "public"."JobRole"("key");

-- CreateIndex
CREATE INDEX "JobRole_title_idx" ON "public"."JobRole"("title");

-- CreateIndex
CREATE INDEX "JobRole_level_idx" ON "public"."JobRole"("level");

-- CreateIndex
CREATE INDEX "JobRole_categoryId_idx" ON "public"."JobRole"("categoryId");

-- CreateIndex
CREATE INDEX "JobRole_specializationId_idx" ON "public"."JobRole"("specializationId");

-- CreateIndex
CREATE INDEX "_SavedQuestionItems_B_index" ON "public"."_SavedQuestionItems"("B");

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_preferredJobRoleId_fkey" FOREIGN KEY ("preferredJobRoleId") REFERENCES "public"."JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "public"."JobRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionItem" ADD CONSTRAINT "QuestionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."QuestionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSet" ADD CONSTRAINT "QuestionSet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSetQuestion" ADD CONSTRAINT "QuestionSetQuestion_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "public"."QuestionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSetQuestion" ADD CONSTRAINT "QuestionSetQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."QuestionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "public"."QuestionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JdAnswers" ADD CONSTRAINT "JdAnswers_jdQuestionSetId_fkey" FOREIGN KEY ("jdQuestionSetId") REFERENCES "public"."JdQuestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "public"."JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPackage" ADD CONSTRAINT "UserPackage_servicePackageId_fkey" FOREIGN KEY ("servicePackageId") REFERENCES "public"."ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPackage" ADD CONSTRAINT "UserPackage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentHistory" ADD CONSTRAINT "PaymentHistory_servicePackageId_fkey" FOREIGN KEY ("servicePackageId") REFERENCES "public"."ServicePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentHistory" ADD CONSTRAINT "PaymentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserActivityEvent" ADD CONSTRAINT "UserActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDailyStats" ADD CONSTRAINT "UserDailyStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSkillSnapshot" ADD CONSTRAINT "UserSkillSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSpecialization" ADD CONSTRAINT "JobSpecialization_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."JobCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobRole" ADD CONSTRAINT "JobRole_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobRole" ADD CONSTRAINT "JobRole_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "public"."JobSpecialization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SavedQuestionItems" ADD CONSTRAINT "_SavedQuestionItems_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."QuestionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_SavedQuestionItems" ADD CONSTRAINT "_SavedQuestionItems_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
