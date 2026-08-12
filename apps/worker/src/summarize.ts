import { prisma } from "@govlens/db";
import { getSolicitationText } from "@govlens/sam-gov-client";
import { summarizeOpportunity } from "@govlens/claude-client";

async function summarizeMissing() {
  const pending = await prisma.opportunity.findMany({
    where: { summary: null },
    take: 20,
  });

  console.log(`Found ${pending.length} opportunities without a summary.`);

  for (const opp of pending) {
    let solicitationText = "No description provided";
    if (opp.description) {
      try {
        solicitationText = await getSolicitationText(opp.description);
      } catch (err) {
        console.error(`  Failed to fetch solicitation text for ${opp.id}:`, err);
      }
    }

    const rawText = `Title: ${opp.title}
Agency: ${opp.agency ?? "Unknown"}
NAICS: ${opp.naicsCode}
Set-Aside: ${opp.setAside ?? "None"}
Description: ${solicitationText}
Due Date: ${opp.dueDate ?? "Not specified"}`;

    try {
      const result = await summarizeOpportunity(rawText);
      await prisma.opportunitySummary.create({
        data: {
          opportunityId: opp.id,
          deadline: result.deadline,
          scope: result.scope,
          eligibility: result.eligibility,
          plainExplanation: result.plainExplanation,
        },
      });
      console.log(`  Summarized: ${opp.title}`);
    } catch (err) {
      console.error(`  Failed to summarize ${opp.id}:`, err);
    }
  }
}

summarizeMissing()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Summarize run failed:", err);
    process.exit(1);
  });
