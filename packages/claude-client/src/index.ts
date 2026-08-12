import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing required environment variable: ANTHROPIC_API_KEY. Check your .env against .env.example."
  );
}
const client = new Anthropic({ apiKey });

const SYSTEM_PROMPT = "You are summarizing US government contract opportunities for small business owners. Use the provided tool to return your summary.";

const SUMMARY_TOOL = {
  name: "submit_summary",
  description: "Submit the structured summary of a government contract opportunity.",
  input_schema: {
    type: "object" as const,
    properties: {
      deadline: {
        type: "string",
        description: "The bid submission deadline, or 'Not specified' if missing",
      },
      scope: {
        type: "string",
        description: "One or two sentence plain description of the actual work required",
      },
      eligibility: {
        type: "string",
        description: "Who can bid - mention any set-aside category like 8(a), WOSB, HUBZone, or 'Open to all businesses' if none",
      },
      plainExplanation: {
        type: "string",
        description: "A short, plain-English explanation a non-expert business owner could understand",
      },
    },
    required: ["deadline", "scope", "eligibility", "plainExplanation"],
  },
};

async function createWithRetry(payload: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.messages.create(payload);
    } catch (err: any) {
      const isRetryable = err?.status === 429 || err?.status >= 500;
      if (!isRetryable || attempt === maxRetries - 1) throw err;
      const delayMs = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Claude API error: exceeded retry attempts");
}

export async function summarizeOpportunity(rawText: string) {
  const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";
  const message = await createWithRetry({
    model: MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    tools: [SUMMARY_TOOL],
    tool_choice: { type: "tool", name: "submit_summary" },
    messages: [{ role: "user", content: rawText }],
  });

  const usage = message.usage;
  console.log(
    "[claude-client] tokens used - input: " + usage.input_tokens + ", output: " + usage.output_tokens
  );

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || !("input" in toolUse)) {
    throw new Error("AI did not return the expected tool_use response");
  }

  return toolUse.input as {
    deadline: string;
    scope: string;
    eligibility: string;
    plainExplanation: string;
  };
}