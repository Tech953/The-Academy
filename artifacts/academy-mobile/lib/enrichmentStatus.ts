export type ContentSource = "online" | "offline" | "rate_limited";

export type EnrichmentStatus =
  | "checking"
  | "live"
  | "offline"
  | "fallback"
  | "rate_limited";

export function getInitialEnrichmentStatus(
  networkOnline: boolean,
  apiConfigured: boolean,
): EnrichmentStatus {
  return networkOnline && apiConfigured ? "checking" : "offline";
}

export function getEnrichmentStatusForSource(
  source: ContentSource,
): EnrichmentStatus {
  if (source === "online") return "live";
  if (source === "rate_limited") return "rate_limited";
  return "fallback";
}