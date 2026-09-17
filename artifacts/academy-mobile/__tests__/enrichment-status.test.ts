import { describe, expect, it } from "vitest";

import {
  getEnrichmentStatusForSource,
  getInitialEnrichmentStatus,
} from "../lib/enrichmentStatus";

describe("enrichment status", () => {
  it("starts in checking mode when a configured API may be reachable", () => {
    expect(getInitialEnrichmentStatus(true, true)).toBe("checking");
  });

  it("starts in local mode when the device is offline or no API is configured", () => {
    expect(getInitialEnrichmentStatus(false, true)).toBe("offline");
    expect(getInitialEnrichmentStatus(true, false)).toBe("offline");
  });

  it("reports live enrichment after an online result", () => {
    expect(getEnrichmentStatusForSource("online")).toBe("live");
  });

  it("reports local fallback after a failed configured request", () => {
    expect(getEnrichmentStatusForSource("offline")).toBe("fallback");
  });

  it("reports a temporary rate limit without switching to raw server errors", () => {
    expect(getEnrichmentStatusForSource("rate_limited")).toBe("rate_limited");
  });
});