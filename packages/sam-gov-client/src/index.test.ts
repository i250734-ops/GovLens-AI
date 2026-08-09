import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getOpportunities", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubEnv("SAM_GOV_API_KEY", "test-key-123");
  });

  it("returns parsed data on a successful response", async () => {
    const mockData = { opportunitiesData: [{ title: "Test Contract" }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })
    );

    const { getOpportunities } = await import("./index");
    const result = await getOpportunities({
      naicsCode: "541512",
      postedFrom: "01/01/2026",
      postedTo: "01/31/2026",
    });

    expect(result).toEqual(mockData);
  });

  it("throws an error on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      })
    );

    const { getOpportunities } = await import("./index");

    await expect(
      getOpportunities({
        naicsCode: "541512",
        postedFrom: "01/01/2026",
        postedTo: "01/31/2026",
      })
    ).rejects.toThrow("SAM.gov API error: 403");
  });

  it("includes the naicsCode in the request URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getOpportunities } = await import("./index");
    await getOpportunities({
      naicsCode: "541512",
      postedFrom: "01/01/2026",
      postedTo: "01/31/2026",
    });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("naicsCode=541512");
  });
});
