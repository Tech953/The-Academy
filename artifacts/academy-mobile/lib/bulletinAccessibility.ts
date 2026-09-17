import {
  getBulletinSourceMessage,
  type SupportedLocale,
} from "@/constants/locales";

export const BULLETIN_REPAIR_ACCESSIBILITY_LABEL =
  getBulletinSourceMessage(true, "en");

export interface BulletinRepairAccessibility {
  accessible: true;
  accessibilityRole: "text";
  accessibilityLabel: string;
  accessibilityLiveRegion: "polite";
}

export function getBulletinRepairAccessibility(
  eventsRepaired: boolean,
  locale?: SupportedLocale | string | null,
): BulletinRepairAccessibility | null {
  if (!eventsRepaired) return null;

  return {
    accessible: true,
    accessibilityRole: "text",
    accessibilityLabel: getBulletinSourceMessage(true, locale),
    accessibilityLiveRegion: "polite",
  };
}