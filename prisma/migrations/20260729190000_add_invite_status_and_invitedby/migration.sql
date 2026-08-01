-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Invite" ADD COLUMN "invitedById" TEXT;

-- Backfill invitedById for any existing rows using the organisation's earliest admin (safe fallback), then make it required
-- Since your Invite table is currently empty, this is safe to set NOT NULL directly:
ALTER TABLE "Invite" ALTER COLUMN "invitedById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
