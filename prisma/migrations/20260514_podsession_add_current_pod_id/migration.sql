-- Add Runpod currentPodId persistence to PodSession

ALTER TABLE "PodSession" ADD COLUMN IF NOT EXISTS "currentPodId" TEXT;
ALTER TABLE "PodSession" ADD COLUMN IF NOT EXISTS "pendingPod" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PodSession" ADD COLUMN IF NOT EXISTS "pendingSince" TIMESTAMP(3);

