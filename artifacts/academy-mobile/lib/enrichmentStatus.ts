import type { ContentPackValidationIssueCode } from "@workspace/game-engine";

export type ContentSource = "online" | "offline" | "rate_limited";

export type EnrichmentStatus =
  | "checking"
  | "live"
  | "offline"
  | "fallback"
  | "rate_limited";

export type ContentPackCacheDiagnosticIssueCode =
  | ContentPackValidationIssueCode
  | "invalid-json";

export type ContentPackCacheIssueCode =
  | ContentPackCacheDiagnosticIssueCode
  | "empty-cache";

export interface ContentPackCacheDiagnostic {
  source: "remote" | "persisted";
  issueCodes: ContentPackCacheDiagnosticIssueCode[];
}

export type ContentPackCacheIssueCategory =
  | "expiry"
  | "events"
  | "unreadable"
  | "metadata";

export function getContentPackCacheIssueCategory(
  issueCodes: readonly ContentPackCacheDiagnosticIssueCode[],
): ContentPackCacheIssueCategory | null {
  if (issueCodes.length === 0) return null;
  if (issueCodes.includes("expiresAt")) return "expiry";
  if (
    issueCodes.includes("activeEvents") ||
    issueCodes.includes("activeEventIds")
  ) {
    return "events";
  }
  if (issueCodes.includes("invalid-json")) return "unreadable";
  return "metadata";
}

export type StudyAvailabilityNoticeStatus =
  | "retrying"
  | Exclude<EnrichmentStatus, "checking" | "live">;

export function getStudyAvailabilityNoticeStatus(
  status: EnrichmentStatus,
  retrying: boolean,
): StudyAvailabilityNoticeStatus | null {
  if (status === "live") return null;
  if (status === "checking") return retrying ? "retrying" : null;
  return status;
}

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