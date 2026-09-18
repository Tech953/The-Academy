export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "ja"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const BULLETIN_LOCALE_STORAGE_KEY = "academy-bulletin-locale-v1";

export const BULLETIN_LOCALE_OPTIONS: ReadonlyArray<{
  value: SupportedLocale;
  label: string;
}> = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

export type MobileCopyKey =
  | "academyTitle"
  | "enrollmentSubtitle"
  | "studentNameLabel"
  | "recruitPlaceholder"
  | "enrollButton"
  | "sector"
  | "week"
  | "day"
  | "campusBulletin"
  | "receivingCampusFeed"
  | "present"
  | "examine"
  | "rescan"
  | "exits"
  | "time"
  | "restEndDay"
  | "contentMode"
  | "statusCheckingApi"
  | "statusLiveAi"
  | "statusLocalMode"
  | "statusLocalFallback"
  | "statusRetryLater"
  | "gedPrep"
  | "weeklyStudyFocus"
  | "focus"
  | "thisWeek"
  | "correct"
  | "weeklyFocus"
  | "generalPractice"
  | "review"
  | "liveRequestPaused"
  | "liveEnrichmentUnavailable"
  | "offlineStudyMode"
  | "liveRequestsPausedCopy"
  | "bundledStudyContentCopy"
  | "retryLiveEnrichment"
  | "retryingLiveRefresh"
  | "retryLiveRefresh"
  | "mathReasoning"
  | "languageArts"
  | "science"
  | "socialStudies";

export type MobileCopy = Record<MobileCopyKey, string>;
export type MobileCopyCatalog = Partial<
  Record<SupportedLocale, Partial<MobileCopy>>
>;

const ENGLISH_MOBILE_COPY: MobileCopy = {
  academyTitle: "THE ACADEMY",
  enrollmentSubtitle: "CAMPUS NETWORK TERMINAL — ENROLLMENT",
  studentNameLabel: "ENTER STUDENT NAME:",
  recruitPlaceholder: "Recruit",
  enrollButton: "ENROLL AT THE ACADEMY",
  sector: "SECTOR",
  week: "WEEK",
  day: "DAY",
  campusBulletin: "CAMPUS BULLETIN",
  receivingCampusFeed: ":: receiving campus feed...",
  present: "PRESENT",
  examine: "EXAMINE",
  rescan: "RE-SCAN",
  exits: "EXITS",
  time: "TIME",
  restEndDay: "REST — END DAY",
  contentMode: "Content mode",
  statusCheckingApi: "CHECKING API",
  statusLiveAi: "LIVE AI",
  statusLocalMode: "LOCAL MODE",
  statusLocalFallback: "LOCAL FALLBACK",
  statusRetryLater: "RETRY LATER",
  gedPrep: "GED PREP",
  weeklyStudyFocus: "WEEKLY STUDY FOCUS",
  focus: "FOCUS",
  thisWeek: "THIS WEEK",
  correct: "correct",
  weeklyFocus: "WEEKLY FOCUS",
  generalPractice: "GENERAL PRACTICE",
  review: "REVIEW",
  liveRequestPaused: "LIVE REQUEST PAUSED",
  liveEnrichmentUnavailable: "LIVE ENRICHMENT UNAVAILABLE",
  offlineStudyMode: "OFFLINE STUDY MODE",
  liveRequestsPausedCopy:
    "Live requests are temporarily paused. Bundled study content is active.",
  bundledStudyContentCopy:
    "Bundled study content is active. You can keep answering questions.",
  retryLiveEnrichment: "Retry live enrichment",
  retryingLiveRefresh: "RETRYING LIVE REFRESH...",
  retryLiveRefresh: "RETRY LIVE REFRESH",
  mathReasoning: "Math Reasoning",
  languageArts: "Language Arts",
  science: "Science",
  socialStudies: "Social Studies",
};

export const MOBILE_COPY_KEYS = Object.keys(
  ENGLISH_MOBILE_COPY,
) as MobileCopyKey[];

export const MOBILE_COPY_CATALOG: MobileCopyCatalog = {
  en: ENGLISH_MOBILE_COPY,
  es: {
    academyTitle: "LA ACADEMIA",
    enrollmentSubtitle: "TERMINAL DE RED DEL CAMPUS — INSCRIPCIÓN",
    studentNameLabel: "INTRODUCE EL NOMBRE DEL ESTUDIANTE:",
    recruitPlaceholder: "Recluta",
    enrollButton: "INSCRIBIRSE EN LA ACADEMIA",
    sector: "SECTOR",
    week: "SEMANA",
    day: "DÍA",
    campusBulletin: "BOLETÍN DEL CAMPUS",
    receivingCampusFeed: ":: recibiendo noticias del campus...",
    present: "PRESENTES",
    examine: "EXAMINAR",
    rescan: "VOLVER A ESCANEAR",
    exits: "SALIDAS",
    time: "TIEMPO",
    restEndDay: "DESCANSAR — TERMINAR EL DÍA",
    contentMode: "Modo de contenido",
    statusCheckingApi: "COMPROBANDO API",
    statusLiveAi: "IA EN VIVO",
    statusLocalMode: "MODO LOCAL",
    statusLocalFallback: "ALTERNATIVA LOCAL",
    statusRetryLater: "REINTENTAR DESPUÉS",
    gedPrep: "PREPARACIÓN GED",
    weeklyStudyFocus: "ENFOQUE DE ESTUDIO SEMANAL",
    focus: "ENFOQUE",
    thisWeek: "ESTA SEMANA",
    correct: "correctas",
    weeklyFocus: "ENFOQUE SEMANAL",
    generalPractice: "PRÁCTICA GENERAL",
    review: "REVISAR",
    liveRequestPaused: "SOLICITUD EN VIVO PAUSADA",
    liveEnrichmentUnavailable: "ENRIQUECIMIENTO EN VIVO NO DISPONIBLE",
    offlineStudyMode: "MODO DE ESTUDIO SIN CONEXIÓN",
    liveRequestsPausedCopy:
      "Las solicitudes en vivo están pausadas. El contenido de estudio incluido está activo.",
    bundledStudyContentCopy:
      "El contenido de estudio incluido está activo. Puedes seguir respondiendo preguntas.",
    retryLiveEnrichment: "Reintentar enriquecimiento en vivo",
    retryingLiveRefresh: "REINTENTANDO ACTUALIZACIÓN EN VIVO...",
    retryLiveRefresh: "REINTENTAR ACTUALIZACIÓN EN VIVO",
    mathReasoning: "Razonamiento matemático",
    languageArts: "Artes del lenguaje",
    science: "Ciencias",
    socialStudies: "Estudios sociales",
  },
  fr: {
    academyTitle: "L'ACADÉMIE",
    enrollmentSubtitle: "TERMINAL RÉSEAU DU CAMPUS — INSCRIPTION",
    studentNameLabel: "ENTREZ LE NOM DE L'ÉLÈVE :",
    recruitPlaceholder: "Recrue",
    enrollButton: "S'INSCRIRE À L'ACADÉMIE",
    sector: "SECTEUR",
    week: "SEMAINE",
    day: "JOUR",
    campusBulletin: "BULLETIN DU CAMPUS",
    receivingCampusFeed: ":: réception du fil du campus...",
    present: "PRÉSENTS",
    examine: "EXAMINER",
    rescan: "RÉANALYSER",
    exits: "SORTIES",
    time: "TEMPS",
    restEndDay: "REPOS — FINIR LA JOURNÉE",
    contentMode: "Mode de contenu",
    statusCheckingApi: "VÉRIFICATION DE L'API",
    statusLiveAi: "IA EN DIRECT",
    statusLocalMode: "MODE LOCAL",
    statusLocalFallback: "REPLI LOCAL",
    statusRetryLater: "RÉESSAYER PLUS TARD",
    gedPrep: "PRÉPARATION GED",
    weeklyStudyFocus: "OBJECTIF D'ÉTUDE HEBDOMADAIRE",
    focus: "OBJECTIF",
    thisWeek: "CETTE SEMAINE",
    correct: "correctes",
    weeklyFocus: "OBJECTIF HEBDOMADAIRE",
    generalPractice: "PRATIQUE GÉNÉRALE",
    review: "À REVOIR",
    liveRequestPaused: "REQUÊTE EN DIRECT EN PAUSE",
    liveEnrichmentUnavailable: "ENRICHISSEMENT EN DIRECT INDISPONIBLE",
    offlineStudyMode: "MODE D'ÉTUDE HORS LIGNE",
    liveRequestsPausedCopy:
      "Les requêtes en direct sont temporairement en pause. Le contenu d'étude intégré est actif.",
    bundledStudyContentCopy:
      "Le contenu d'étude intégré est actif. Vous pouvez continuer à répondre aux questions.",
    retryLiveEnrichment: "Réessayer l'enrichissement en direct",
    retryingLiveRefresh: "NOUVELLE ACTUALISATION EN DIRECT...",
    retryLiveRefresh: "RÉESSAYER L'ACTUALISATION EN DIRECT",
    mathReasoning: "Raisonnement mathématique",
    languageArts: "Arts du langage",
    science: "Sciences",
    socialStudies: "Sciences sociales",
  },
  de: {
    academyTitle: "DIE AKADEMIE",
    enrollmentSubtitle: "CAMPUS-NETZWERKTERMINAL — ANMELDUNG",
    studentNameLabel: "NAMEN DER STUDIERENDEN EINGEBEN:",
    recruitPlaceholder: "Rekrut",
    enrollButton: "AN DER AKADEMIE ANMELDEN",
    sector: "SEKTOR",
    week: "WOCHE",
    day: "TAG",
    campusBulletin: "CAMPUS-BULLETIN",
    receivingCampusFeed: ":: Campus-Feed wird empfangen...",
    present: "ANWESEND",
    examine: "UNTERSUCHEN",
    rescan: "ERNEUT SCANNEN",
    exits: "AUSGÄNGE",
    time: "ZEIT",
    restEndDay: "RUHEN — TAG BEENDEN",
    contentMode: "Inhaltsmodus",
    statusCheckingApi: "API WIRD GEPRÜFT",
    statusLiveAi: "LIVE-KI",
    statusLocalMode: "LOKALER MODUS",
    statusLocalFallback: "LOKALER ERSATZ",
    statusRetryLater: "SPÄTER ERNEUT VERSUCHEN",
    gedPrep: "GED-VORBEREITUNG",
    weeklyStudyFocus: "WÖCHENTLICHER LERNFOKUS",
    focus: "FOKUS",
    thisWeek: "DIESE WOCHE",
    correct: "richtig",
    weeklyFocus: "WÖCHENTLICHER FOKUS",
    generalPractice: "ALLGEMEINE ÜBUNG",
    review: "ÜBERPRÜFEN",
    liveRequestPaused: "LIVE-ANFRAGE PAUSIERT",
    liveEnrichmentUnavailable: "LIVE-ERWEITERUNG NICHT VERFÜGBAR",
    offlineStudyMode: "OFFLINE-LERNMODUS",
    liveRequestsPausedCopy:
      "Live-Anfragen sind vorübergehend pausiert. Gebündelte Lerninhalte sind aktiv.",
    bundledStudyContentCopy:
      "Gebündelte Lerninhalte sind aktiv. Du kannst weiter Fragen beantworten.",
    retryLiveEnrichment: "Live-Erweiterung erneut versuchen",
    retryingLiveRefresh: "LIVE-AKTUALISIERUNG WIRD ERNEUT VERSUCHT...",
    retryLiveRefresh: "LIVE-AKTUALISIERUNG ERNEUT VERSUCHEN",
    mathReasoning: "Mathematisches Denken",
    languageArts: "Sprachkunst",
    science: "Naturwissenschaften",
    socialStudies: "Sozialkunde",
  },
  ja: {
    academyTitle: "アカデミー",
    enrollmentSubtitle: "キャンパスネットワーク端末 — 登録",
    studentNameLabel: "学生名を入力：",
    recruitPlaceholder: "訓練生",
    enrollButton: "アカデミーに登録",
    sector: "セクター",
    week: "週",
    day: "日",
    campusBulletin: "キャンパス掲示板",
    receivingCampusFeed: ":: キャンパスフィードを受信中...",
    present: "在席",
    examine: "調査",
    rescan: "再スキャン",
    exits: "出口",
    time: "時間",
    restEndDay: "休息 — 一日を終える",
    contentMode: "コンテンツモード",
    statusCheckingApi: "APIを確認中",
    statusLiveAi: "ライブAI",
    statusLocalMode: "ローカルモード",
    statusLocalFallback: "ローカル代替",
    statusRetryLater: "後でもう一度",
    gedPrep: "GED対策",
    weeklyStudyFocus: "今週の学習重点",
    focus: "重点",
    thisWeek: "今週",
    correct: "正解",
    weeklyFocus: "週間重点",
    generalPractice: "通常練習",
    review: "復習",
    liveRequestPaused: "ライブリクエストを一時停止",
    liveEnrichmentUnavailable: "ライブ拡張を利用できません",
    offlineStudyMode: "オフライン学習モード",
    liveRequestsPausedCopy:
      "ライブリクエストは一時停止中です。内蔵の学習コンテンツが有効です。",
    bundledStudyContentCopy:
      "内蔵の学習コンテンツが有効です。引き続き問題に回答できます。",
    retryLiveEnrichment: "ライブ拡張を再試行",
    retryingLiveRefresh: "ライブ更新を再試行中...",
    retryLiveRefresh: "ライブ更新を再試行",
    mathReasoning: "数学的推論",
    languageArts: "言語芸術",
    science: "科学",
    socialStudies: "社会科",
  },
};

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

export function parseStoredBulletinLocale(
  value: string | null | undefined,
): SupportedLocale | null {
  if (!value) return null;
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
    ? (value as SupportedLocale)
    : null;
}

export function getMobileCopy(
  key: MobileCopyKey,
  locale: string | null | undefined = getDeviceLocale(),
  catalog: MobileCopyCatalog = MOBILE_COPY_CATALOG,
): string {
  const resolvedLocale = resolveLocale(locale);
  return (
    catalog[resolvedLocale]?.[key] ??
    catalog.en?.[key] ??
    ENGLISH_MOBILE_COPY[key] ??
    key
  );
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