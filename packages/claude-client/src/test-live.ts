import { summarizeOpportunity } from "./index";

const sampleOpportunities = [
  "Title: IT Support Services\nAgency: Department of Veterans Affairs\nNAICS: 541512\nSet-Aside: 8(a)\nDescription: The contractor shall provide helpdesk and IT support services for VA regional offices, including hardware troubleshooting and network maintenance.\nDue Date: 09/15/2026",
  "Title: Office Cleaning Services\nAgency: General Services Administration\nNAICS: 561720\nSet-Aside: None\nDescription: Provide daily janitorial services for a 3-story federal office building, including trash removal, floor cleaning, and restroom sanitation.\nDue Date: 10/01/2026",
];

async function main() {
  for (const text of sampleOpportunities) {
    console.log("--- Input ---");
    console.log(text);
    try {
      const result = await summarizeOpportunity(text);
      console.log("--- Result ---");
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("ERROR:", err);
    }
    console.log("\n");
  }
}

main();