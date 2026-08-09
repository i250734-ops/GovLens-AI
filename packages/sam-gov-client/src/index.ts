import "dotenv/config";

const SAM_GOV_API_KEY = process.env.SAM_GOV_API_KEY;
const BASE_URL = "https://api.sam.gov/opportunities/v2/search";

export async function getOpportunities(params: {
  postedFrom: string;
  postedTo: string;
  limit?: number;
}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", SAM_GOV_API_KEY!);
  url.searchParams.set("postedFrom", params.postedFrom);
  url.searchParams.set("postedTo", params.postedTo);
  url.searchParams.set("limit", String(params.limit ?? 10));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("SAM.gov API error: " + response.status);
  }

  return response.json();
}
