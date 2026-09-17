export const BULLETIN_REPAIR_ACCESSIBILITY_LABEL =
  "Local events included. Bulletin continues.";

export interface BulletinRepairAccessibility {
  accessible: true;
  accessibilityRole: "text";
  accessibilityLabel: string;
  accessibilityLiveRegion: "polite";
}

export function getBulletinRepairAccessibility(
  eventsRepaired: boolean,
): BulletinRepairAccessibility | null {
  if (!eventsRepaired) return null;

  return {
    accessible: true,
    accessibilityRole: "text",
    accessibilityLabel: BULLETIN_REPAIR_ACCESSIBILITY_LABEL,
    accessibilityLiveRegion: "polite",
  };
}