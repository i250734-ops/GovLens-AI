-- CreateTable
CREATE TABLE "OpportunitySummary" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "deadline" TEXT,
    "scope" TEXT,
    "eligibility" TEXT,
    "plainExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunitySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySummary_opportunityId_key" ON "OpportunitySummary"("opportunityId");

-- AddForeignKey
ALTER TABLE "OpportunitySummary" ADD CONSTRAINT "OpportunitySummary_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
