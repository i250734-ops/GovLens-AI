import { prisma } from "@govlens/db";
import { getOpportunities } from "@govlens/sam-gov-client";

const FALLBACK_NAICS = ["541512"];
const PAGE_SIZE = 50;
const PAGE_DELAY_MS = 500;

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function safeParseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getNaicsCodes(): Promise<string[]> {
  const users = await prisma.user.findMany({ select: { naicsCodes: true } });
  const codes = new Set<string>();
  for (const u of users) {
    for (const c of u.naicsCodes) codes.add(c);
  }
  if (codes.size === 0) {
    console.log("No users/naicsCodes found, using fallback:", FALLBACK_NAICS);
    return FALLBACK_NAICS;
  }
  return Array.from(codes);
}

async function ingest() {
  const naicsCodes = await getNaicsCodes();

  const today = new Date();
  const past = new Date();
  past.setDate(past.getDate() - 30);
  const postedFrom = formatDate(past);
  const postedTo = formatDate(today);

  let totalFetched = 0;
  let totalInserted = 0;

  for (const naicsCode of naicsCodes) {
    console.log(`Fetching opportunities for NAICS ${naicsCode}...`);

    let offset = 0;
    let keepGoing = true;

    while (keepGoing) {
      let data: any;
      try {
        data = await getOpportunities({
          naicsCode,
          postedFrom,
          postedTo,
          limit: PAGE_SIZE,
          offset,
        });
      } catch (err) {
        console.error(`Failed to fetch for NAICS ${naicsCode} at offset ${offset}:`, err);
        break;
      }

      const rawOpportunities = data.opportunitiesData ?? [];
      totalFetched += rawOpportunities.length;

      const recordsToInsert = rawOpportunities
        .filter((opp: any) => !!opp.noticeId)
        .map((opp: any) => ({
          samGovId: opp.noticeId,
          title: opp.title ?? "Untitled",
          naicsCode,
          setAside: opp.typeOfSetAside ?? null,
          agency: opp.fullParentPathName ?? null,
          description: opp.description ?? null,
          postedDate: safeParseDate(opp.postedDate),
          dueDate: safeParseDate(opp.responseDeadLine),
        }));

      if (recordsToInsert.length > 0) {
        const result = await prisma.opportunity.createMany({
          data: recordsToInsert,
          skipDuplicates: true,
        });
        totalInserted += result.count;
      }

      console.log(`  Page at offset ${offset}: got ${rawOpportunities.length} results`);

      if (rawOpportunities.length < PAGE_SIZE) {
        keepGoing = false;
      } else {
        offset += PAGE_SIZE;
        await sleep(PAGE_DELAY_MS);
      }
    }
  }

  console.log(`Done. Fetched: ${totalFetched}, New inserted: ${totalInserted}`);
}

ingest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Ingest failed:", err);
    process.exit(1);
  });
