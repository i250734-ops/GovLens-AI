import "dotenv/config";

const SAM_GOV_API_KEY = process.env.SAM_GOV_API_KEY;

if (!SAM_GOV_API_KEY) {
  throw new Error(
    "Missing required environment variable: SAM_GOV_API_KEY. Check your .env against .env.example."
  );
}

const BASE_URL = "https://api.sam.gov/opportunities/v2/search";

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status === 429 || response.status >= 500) {
      const delayMs = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    throw new Error("SAM.gov API error: " + response.status);
  }
  throw new Error("SAM.gov API error: exceeded retry attempts");
}

export async function getOpportunities(params: {
  naicsCode: string;
  postedFrom: string;
  postedTo: string;
  limit?: number;
  offset?: number;
}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", SAM_GOV_API_KEY as string);
  url.searchParams.set("naicsCode", params.naicsCode);
  url.searchParams.set("postedFrom", params.postedFrom);
  url.searchParams.set("postedTo", params.postedTo);
  url.searchParams.set("limit", String(params.limit ?? 10));
  url.searchParams.set("offset", String(params.offset ?? 0));

  const response = await fetchWithRetry(url.toString());

  return response.json();
}
export async function getSolicitationText(descriptionUrl: string): Promise<string> {
  const url = new URL(descriptionUrl);
  url.searchParams.set("api_key", SAM_GOV_API_KEY as string);

  const response = await fetchWithRetry(url.toString());
  const data = await response.json();

  return data.description ?? data.text ?? "No solicitation text available";
}