-- All changes are additive. Existing users, news, and interactions are retained.
CREATE TYPE "InterestSource" AS ENUM ('EXPLICIT', 'BEHAVIOR', 'AI_INFERRED', 'IMPORTED');
CREATE TYPE "ExperienceLevel" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');
CREATE TYPE "EmploymentStatus" AS ENUM ('STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'SEEKING_WORK');

ALTER TYPE "NewsInteractionType" ADD VALUE IF NOT EXISTS 'HIDE';
ALTER TYPE "NewsInteractionType" ADD VALUE IF NOT EXISTS 'NOT_INTERESTED';
ALTER TABLE "NewsInteraction" ADD COLUMN "duration" INTEGER;
ALTER TABLE "NewsInteraction" ADD COLUMN "scrollPercentage" INTEGER;
CREATE INDEX "NewsInteraction_type_idx" ON "NewsInteraction"("type");

CREATE TABLE "CareerField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "careerFieldId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerFieldId" TEXT,
    "currentRoleId" TEXT,
    "experienceLevel" "ExperienceLevel",
    "employmentStatus" "EmploymentStatus",
    "countryCode" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSkillInterest" (
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "UserSkillInterest_pkey" PRIMARY KEY ("userId", "skillId")
);

CREATE TABLE "UserTopicInterest" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" "InterestSource" NOT NULL DEFAULT 'EXPLICIT',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTopicInterest_pkey" PRIMARY KEY ("userId", "topicId")
);

CREATE TABLE "CareerGoal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserCareerGoal" (
    "userProfileId" TEXT NOT NULL,
    "careerGoalId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "UserCareerGoal_pkey" PRIMARY KEY ("userProfileId", "careerGoalId")
);

CREATE TABLE "UserCareerInterest" (
    "userId" TEXT NOT NULL,
    "careerFieldId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" "InterestSource" NOT NULL DEFAULT 'EXPLICIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserCareerInterest_pkey" PRIMARY KEY ("userId", "careerFieldId")
);

CREATE UNIQUE INDEX "CareerField_name_key" ON "CareerField"("name");
CREATE UNIQUE INDEX "CareerField_slug_key" ON "CareerField"("slug");
CREATE UNIQUE INDEX "CareerRole_name_key" ON "CareerRole"("name");
CREATE UNIQUE INDEX "CareerRole_slug_key" ON "CareerRole"("slug");
CREATE INDEX "CareerRole_careerFieldId_idx" ON "CareerRole"("careerFieldId");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE INDEX "UserProfile_careerFieldId_idx" ON "UserProfile"("careerFieldId");
CREATE INDEX "UserProfile_currentRoleId_idx" ON "UserProfile"("currentRoleId");
CREATE INDEX "UserProfile_experienceLevel_idx" ON "UserProfile"("experienceLevel");
CREATE INDEX "UserProfile_employmentStatus_idx" ON "UserProfile"("employmentStatus");
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");
CREATE INDEX "UserSkillInterest_skillId_idx" ON "UserSkillInterest"("skillId");
CREATE INDEX "UserTopicInterest_topicId_idx" ON "UserTopicInterest"("topicId");
CREATE INDEX "UserTopicInterest_userId_weight_idx" ON "UserTopicInterest"("userId", "weight");
CREATE UNIQUE INDEX "CareerGoal_name_key" ON "CareerGoal"("name");
CREATE UNIQUE INDEX "CareerGoal_slug_key" ON "CareerGoal"("slug");
CREATE INDEX "UserCareerInterest_careerFieldId_idx" ON "UserCareerInterest"("careerFieldId");
CREATE INDEX "UserCareerInterest_userId_weight_idx" ON "UserCareerInterest"("userId", "weight");

ALTER TABLE "CareerRole" ADD CONSTRAINT "CareerRole_careerFieldId_fkey" FOREIGN KEY ("careerFieldId") REFERENCES "CareerField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_careerFieldId_fkey" FOREIGN KEY ("careerFieldId") REFERENCES "CareerField"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "CareerRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserSkillInterest" ADD CONSTRAINT "UserSkillInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSkillInterest" ADD CONSTRAINT "UserSkillInterest_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTopicInterest" ADD CONSTRAINT "UserTopicInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTopicInterest" ADD CONSTRAINT "UserTopicInterest_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCareerGoal" ADD CONSTRAINT "UserCareerGoal_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCareerGoal" ADD CONSTRAINT "UserCareerGoal_careerGoalId_fkey" FOREIGN KEY ("careerGoalId") REFERENCES "CareerGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCareerInterest" ADD CONSTRAINT "UserCareerInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCareerInterest" ADD CONSTRAINT "UserCareerInterest_careerFieldId_fkey" FOREIGN KEY ("careerFieldId") REFERENCES "CareerField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
