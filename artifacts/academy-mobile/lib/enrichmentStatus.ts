export type ContentSource = "online" | "offline";

export type EnrichmentStatus = "checking" | "live" | "offline" | "fallback";

export function getInitialEnrichmentStatus(
  networkOnline: boolean,
  apiConfigured: boolean,
): EnrichmentStatus {
  return networkOnline && apiConfigured ? "checking" : "offline";
}

export function getEnrichmentStatusForSource(
  source: ContentSource,
): EnrichmentStatus {
  return source === "online" ? "live" : "fallback";
}