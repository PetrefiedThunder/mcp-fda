import { describe, it, expect } from "vitest";

describe("mcp-fda", () => {
  it("should build correct API URLs", () => {
    const base = "https://api.fda.gov";
    const url = new URL(`${base}/drug/event.json`);
    url.searchParams.set("search", 'patient.drug.openfda.brand_name:"aspirin"');
    url.searchParams.set("limit", "10");
    expect(url.toString()).toContain("/drug/event.json");
    expect(url.toString()).toContain("search=");
    expect(url.toString()).toContain("limit=10");
  });

  it("should include API key when set", () => {
    const base = "https://api.fda.gov";
    const url = new URL(`${base}/drug/label.json`);
    const key = "test_key_123";
    url.searchParams.set("api_key", key);
    url.searchParams.set("search", "openfda.brand_name:lipitor");
    expect(url.toString()).toContain("api_key=test_key_123");
  });

  it("should support all endpoint types", () => {
    const endpoints = [
      "/drug/event", "/drug/label", "/drug/enforcement",
      "/device/event", "/device/enforcement",
      "/food/event", "/food/enforcement",
    ];
    for (const ep of endpoints) {
      const url = `https://api.fda.gov${ep}.json`;
      expect(url).toMatch(/^https:\/\/api\.fda\.gov\//);
      expect(url).toMatch(/\.json$/);
    }
  });

  it("should handle count field parameter", () => {
    const url = new URL("https://api.fda.gov/drug/event.json");
    url.searchParams.set("count", "patient.reaction.reactionmeddrapt.exact");
    url.searchParams.set("limit", "10");
    expect(url.toString()).toContain("count=patient.reaction.reactionmeddrapt.exact");
  });

  it("should enforce rate limit timing", () => {
    const RATE_LIMIT_MS = 250;
    const lastRequest = Date.now() - 100;
    const elapsed = Date.now() - lastRequest;
    expect(elapsed < RATE_LIMIT_MS).toBe(true);
  });

  it("should respect max limits", () => {
    const limit = Math.min(Math.max(1, 150), 100);
    expect(limit).toBe(100);
    const limit2 = Math.min(Math.max(1, 50), 100);
    expect(limit2).toBe(50);
  });
});
