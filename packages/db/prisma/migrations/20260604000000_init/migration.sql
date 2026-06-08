CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');
CREATE TYPE "DeploymentType" AS ENUM ('SELF_HOSTED', 'OFFICIAL_HOSTED');
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'USAGE_BASED', 'SELF_HOSTED');
CREATE TYPE "EmotionMode" AS ENUM ('HAPPY', 'ANGRY', 'SAD', 'MESSY');
CREATE TYPE "DiaryPrivacyLevel" AS ENUM ('NORMAL', 'LOCKED');

CREATE TABLE "UserAccount" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "deploymentType" "DeploymentType" NOT NULL DEFAULT 'SELF_HOSTED',
  "plan" "PlanType" NOT NULL DEFAULT 'SELF_HOSTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiaryEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "mode" "EmotionMode" NOT NULL,
  "title" TEXT,
  "diaryText" TEXT NOT NULL,
  "oneSentenceSummary" TEXT NOT NULL,
  "structuredJson" JSONB NOT NULL,
  "sourceSessionId" TEXT,
  "rawConversation" JSONB NOT NULL DEFAULT '[]',
  "userEdited" BOOLEAN NOT NULL DEFAULT false,
  "privacyLevel" "DiaryPrivacyLevel" NOT NULL DEFAULT 'NORMAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mode" "EmotionMode" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "stateJson" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSetting" (
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "encrypted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" "PlanType" NOT NULL,
  "status" TEXT NOT NULL,
  "billingCycle" TEXT,
  "includedAiCredits" INTEGER NOT NULL DEFAULT 0,
  "usedAiCredits" INTEGER NOT NULL DEFAULT 0,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "aiCredits" INTEGER NOT NULL DEFAULT 0,
  "estimatedCost" DECIMAL(65,30),
  "currency" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");
CREATE UNIQUE INDEX "DiaryEntry_sourceSessionId_key" ON "DiaryEntry"("sourceSessionId");
CREATE INDEX "DiaryEntry_userId_date_idx" ON "DiaryEntry"("userId", "date");
CREATE INDEX "DiaryEntry_userId_deletedAt_idx" ON "DiaryEntry"("userId", "deletedAt");
CREATE INDEX "ChatSession_userId_createdAt_idx" ON "ChatSession"("userId", "createdAt");
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");
CREATE INDEX "UsageRecord_userId_createdAt_idx" ON "UsageRecord"("userId", "createdAt");

ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_sourceSessionId_fkey" FOREIGN KEY ("sourceSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
