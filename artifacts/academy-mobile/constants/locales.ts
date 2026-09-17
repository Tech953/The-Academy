export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "ja"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type BulletinSourceMessages = {
  remote: string;
  repaired: string;
};

export type BulletinSourceCatalog = Partial<
  Record<SupportedLocale, Partial<BulletinSourceMessages>>
>;

export const BULLETIN_SOURCE_MESSAGES: Record<
  SupportedLocale,
  BulletinSourceMessages
> = {
  en: {
    remote: "LIVE CAMPUS FEED",
    repaired: "LOCAL EVENTS INCLUDED — BULLETIN CONTINUES",
  },
  es: {
    remote: "ACTUALIZACIONES DEL CAMPUS EN VIVO",
    repaired: "EVENTOS LOCALES INCLUIDOS — EL BOLETÍN CONTINÚA",
  },
  fr: {
    remote: "FIL DU CAMPUS EN DIRECT",
    repaired: "ÉVÉNEMENTS LOCAUX INCLUS — LE BULLETIN CONTINUE",
  },
  de: {
    remote: "LIVE-CAMPUS-FEED",
    repaired: "LOKALE EREIGNISSE ENTHALTEN — BULLETIN LÄUFT WEITER",
  },
  ja: {
    remote: "キャンパス最新情報",
    repaired: "ローカルイベントを追加 — 掲示板を継続",
  },
};

export function resolveLocale(
  locale: string | null | undefined,
): SupportedLocale {
  const normalized = locale?.trim().toLowerCase().replace("_", "-");
  if (!normalized) return DEFAULT_LOCALE;

  const exact = SUPPORTED_LOCALES.find(
    (supportedLocale) => supportedLocale === normalized,
  );
  if (exact) return exact;

  const language = normalized.split("-")[0];
  return (
    SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale === language) ??
    DEFAULT_LOCALE
  );
}

export function getDeviceLocale(): SupportedLocale {
  try {
    return resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getBulletinSourceMessage(
  repaired: boolean,
  locale: string | null | undefined = getDeviceLocale(),
  catalog: BulletinSourceCatalog = BULLETIN_SOURCE_MESSAGES,
): string {
  const localeMessages = catalog[resolveLocale(locale)];
  const message = localeMessages?.[repaired ? "repaired" : "remote"];
  return message ?? BULLETIN_SOURCE_MESSAGES.en[repaired ? "repaired" : "remote"];
}