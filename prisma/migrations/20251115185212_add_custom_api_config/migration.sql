-- AlterTable
ALTER TABLE "Competition" ADD COLUMN "customBaseUrl" TEXT,
ADD COLUMN "customHeaders" TEXT;

-- AlterTable
ALTER TABLE "PracticeChallenge" ADD COLUMN "customBaseUrl" TEXT,
ADD COLUMN "customHeaders" TEXT;
