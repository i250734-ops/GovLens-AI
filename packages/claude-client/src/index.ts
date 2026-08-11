import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are summarizing US government contract opportunities for small business owners.
Given the raw opportunity text, respond ONLY with valid JSON in this exact shape, no extra commentary:

{
  "deadline": "<the bid submission deadline, or Not specified if missing>",
  "scope": "<one or two sentence plain description of the actual work required>",
  "eligibility": "<who can bid - mention any set-aside category like 8(a), WOSB, HUBZone, or Open to all businesses if none>",
  "plainExplanation": "<a short, plain-English explanation a non-expert business owner could understand>"
}`;

export async function summarizeOpportunity(rawText: string) {
  const message = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: rawText }],
  });

  const usage = message.usage;
  console.log(
    "[claude-client] tokens used - input: " + usage.input_tokens + ", output: " + usage.output_tokens
  );

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log("[claude-client] failed to parse AI response as JSON:", raw);
    throw new Error("AI response was not valid JSON");
  }
}

