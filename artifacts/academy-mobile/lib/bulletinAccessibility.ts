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

/**
 * iOS does not consistently announce React Native live-region updates.
 * Android uses accessibilityLiveRegion instead, so only iOS gets the
 * explicit announcement to avoid hearing the cue twice on TalkBack.
 */
export function shouldAnnounceBulletinRepair(
  platform: string,
  wasRepaired: boolean,
  isRepaired: boolean,
): boolean {
  return platform === "ios" && !wasRepaired && isRepaired;
}