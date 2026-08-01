ALTER TABLE "Approval" RENAME COLUMN "note" TO "comment";
ALTER TABLE "Approval" RENAME COLUMN "userId" TO "approvedById";
ALTER TABLE "Approval" ALTER COLUMN "approvedById" DROP NOT NULL;
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_userId_fkey";
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
