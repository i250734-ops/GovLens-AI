import { describe, it, expect, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { create: mockCreate };
    },
  };
});

process.env.ANTHROPIC_API_KEY = "test-key";

describe("summarizeOpportunity", () => {
  it("returns parsed data from a successful tool_use response", async () => {
    const { summarizeOpportunity } = await import("./index");
    const Anthropic = (await import("@anthropic-ai/sdk")).default as any;
    
    mockCreate.mockResolvedValueOnce({
      usage: { input_tokens: 10, output_tokens: 20 },
      content: [
        {
          type: "tool_use",
          input: {
            deadline: "2026-09-01",
            scope: "Build a website",
            eligibility: "Open to all businesses",
            plainExplanation: "They need a website built",
          },
        },
      ],
    });

    const result = await summarizeOpportunity("some raw text");
    expect(result.deadline).toBe("2026-09-01");
    expect(result.scope).toBe("Build a website");
  });

  it("throws a clear error when no tool_use block is returned", async () => {
    const { summarizeOpportunity } = await import("./index");
    const Anthropic = (await import("@anthropic-ai/sdk")).default as any;
   

    mockCreate.mockResolvedValueOnce({
      usage: { input_tokens: 10, output_tokens: 5 },
      content: [{ type: "text", text: "I could not process this." }],
    });

    await expect(summarizeOpportunity("some raw text")).rejects.toThrow(
      "AI did not return the expected tool_use response"
    );
  });
});