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
  | "relatedPracticeCopy"
  | "review"
  | "liveRequestPaused"
  | "liveEnrichmentUnavailable"
  | "offlineStudyMode"
  | "liveRequestsPausedCopy"
  | "bundledStudyContentCopy"
  | "bulletinCacheIssue"
  | "bulletinCacheExpiry"
  | "bulletinCacheEvents"
  | "bulletinCacheUnreadable"
  | "bulletinCacheMetadata"
  | "retryLiveEnrichment"
  | "retryingLiveRefresh"
  | "retryLiveRefresh"
  | "mathReasoning"
  | "languageArts"
  | "science"
  | "socialStudies"
  | "studentFileTitle"
  | "studentFileProgress"
  | "studentFileExploration"
  | "studentCoreStats"
  | "studentInventory"
  | "studentInventoryEmpty"
  | "bulletinLanguage"
  | "currentBulletinLanguage"
  | "deviceDefault"
  | "followDeviceLanguage"
  | "withdrawRestart"
  | "withdrawConfirmTitle"
  | "withdrawConfirmMessage"
  | "cancel"
  | "withdraw"
  | "englishLanguageName"
  | "campusDirectoryTitle"
  | "weeklyCampusTheme"
  | "weeklyTheme"
  | "relationshipProgressTo"
  | "relationshipMaxTier"
  | "relationshipStatus"
  | "relationshipNextTier"
  | "relationshipTierStranger"
  | "relationshipTierAcquaintance"
  | "relationshipTierFriendly"
  | "relationshipTierFriend"
  | "relationshipTierClose"
  | "relationshipTierTrusted"
  | "weeklyThemeUpdated"
  | "conversationThemeUpdated"
  | "dismissThemeUpdateNotice"
  | "updatedThemeRemainsVisible"
  | "relationshipWarmer"
  | "relationshipCooler"
  | "relationshipNowTier"
  | "awaitingResponse"
  | "saySomething"
  | "sendMessage"
  | "backToDirectory"
  | "statQuickness"
  | "statStrength"
  | "statMathLogic"
  | "statPresence"
  | "statLuck"
  | "statResonance";

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
  relatedPracticeCopy: "This focus uses related practice:",
  review: "REVIEW",
  liveRequestPaused: "LIVE REQUEST PAUSED",
  liveEnrichmentUnavailable: "LIVE ENRICHMENT UNAVAILABLE",
  offlineStudyMode: "OFFLINE STUDY MODE",
  liveRequestsPausedCopy:
    "Live requests are temporarily paused. Bundled study content is active.",
  bundledStudyContentCopy:
    "Bundled study content is active. You can keep answering questions.",
  bulletinCacheIssue: "BULLETIN CACHE ISSUE",
  bulletinCacheExpiry: "EXPIRED CONTENT",
  bulletinCacheEvents: "EVENT DATA",
  bulletinCacheUnreadable: "UNREADABLE CACHE",
  bulletinCacheMetadata: "INVALID METADATA",
  retryLiveEnrichment: "Retry live enrichment",
  retryingLiveRefresh: "RETRYING LIVE REFRESH...",
  retryLiveRefresh: "RETRY LIVE REFRESH",
  mathReasoning: "Math Reasoning",
  languageArts: "Language Arts",
  science: "Science",
  socialStudies: "Social Studies",
  studentFileTitle: "STUDENT FILE",
  studentFileProgress: "WEEK {week} · DAY {day} · {xp} XP",
  studentFileExploration: "{sectors} SECTORS EXPLORED · {objects} OBJECTS EXAMINED",
  studentCoreStats: "CORE STATS",
  studentInventory: "INVENTORY",
  studentInventoryEmpty: "No items collected yet.",
  bulletinLanguage: "BULLETIN LANGUAGE",
  currentBulletinLanguage: "CURRENT: {language}",
  deviceDefault: "DEVICE DEFAULT",
  followDeviceLanguage: "Follow the device language",
  withdrawRestart: "WITHDRAW & RESTART",
  withdrawConfirmTitle: "Withdraw from the Academy?",
  withdrawConfirmMessage: "This clears your progress, inventory, and relationships.",
  cancel: "Cancel",
  withdraw: "Withdraw",
  englishLanguageName: "English",
  campusDirectoryTitle: "CAMPUS DIRECTORY",
  weeklyCampusTheme: "WEEKLY CAMPUS THEME",
  weeklyTheme: "WEEKLY THEME",
  relationshipProgressTo: "{progress}% TO {tier}",
  relationshipMaxTier: "MAX TIER",
  relationshipStatus: "RELATIONSHIP {score} / {endScore}",
  relationshipNextTier: "NEXT {tier}",
  relationshipTierStranger: "STRANGER",
  relationshipTierAcquaintance: "ACQUAINTANCE",
  relationshipTierFriendly: "FRIENDLY",
  relationshipTierFriend: "FRIEND",
  relationshipTierClose: "CLOSE",
  relationshipTierTrusted: "TRUSTED",
  weeklyThemeUpdated: "WEEKLY THEME UPDATED",
  conversationThemeUpdated: "This conversation now follows the updated campus theme.",
  dismissThemeUpdateNotice: "Dismiss weekly theme update notice",
  updatedThemeRemainsVisible: "The updated weekly theme remains visible above.",
  relationshipWarmer: "+ warmer",
  relationshipCooler: "- cooler",
  relationshipNowTier: "now {tier}",
  awaitingResponse: ":: awaiting response...",
  saySomething: "Say something...",
  sendMessage: "Send message",
  backToDirectory: "Back to directory",
  statQuickness: "Quickness",
  statStrength: "Strength",
  statMathLogic: "Math/Logic",
  statPresence: "Presence",
  statLuck: "Luck",
  statResonance: "Resonance",
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
    relatedPracticeCopy: "Este enfoque usa práctica relacionada:",
    review: "REVISAR",
    liveRequestPaused: "SOLICITUD EN VIVO PAUSADA",
    liveEnrichmentUnavailable: "ENRIQUECIMIENTO EN VIVO NO DISPONIBLE",
    offlineStudyMode: "MODO DE ESTUDIO SIN CONEXIÓN",
    liveRequestsPausedCopy:
      "Las solicitudes en vivo están pausadas. El contenido de estudio incluido está activo.",
    bundledStudyContentCopy:
      "El contenido de estudio incluido está activo. Puedes seguir respondiendo preguntas.",
    bulletinCacheIssue: "PROBLEMA DE CACHÉ DEL BOLETÍN",
    bulletinCacheExpiry: "CONTENIDO CADUCADO",
    bulletinCacheEvents: "DATOS DE EVENTOS",
    bulletinCacheUnreadable: "CACHÉ ILEGIBLE",
    bulletinCacheMetadata: "METADATOS NO VÁLIDOS",
    retryLiveEnrichment: "Reintentar enriquecimiento en vivo",
    retryingLiveRefresh: "REINTENTANDO ACTUALIZACIÓN EN VIVO...",
    retryLiveRefresh: "REINTENTAR ACTUALIZACIÓN EN VIVO",
    mathReasoning: "Razonamiento matemático",
    languageArts: "Artes del lenguaje",
    science: "Ciencias",
    socialStudies: "Estudios sociales",
    studentFileTitle: "ARCHIVO DEL ESTUDIANTE",
    studentFileProgress: "SEMANA {week} · DÍA {day} · {xp} XP",
    studentFileExploration: "{sectors} SECTORES EXPLORADOS · {objects} OBJETOS EXAMINADOS",
    studentCoreStats: "ATRIBUTOS PRINCIPALES",
    studentInventory: "INVENTARIO",
    studentInventoryEmpty: "Aún no has recogido objetos.",
    bulletinLanguage: "IDIOMA DEL BOLETÍN",
    currentBulletinLanguage: "ACTUAL: {language}",
    deviceDefault: "IDIOMA DEL DISPOSITIVO",
    followDeviceLanguage: "Seguir el idioma del dispositivo",
    withdrawRestart: "RETIRARSE Y REINICIAR",
    withdrawConfirmTitle: "¿Retirarse de la Academia?",
    withdrawConfirmMessage: "Se borrarán tu progreso, inventario y relaciones.",
    cancel: "Cancelar",
    withdraw: "Retirarse",
    englishLanguageName: "Inglés",
    campusDirectoryTitle: "DIRECTORIO DEL CAMPUS",
    weeklyCampusTheme: "TEMA SEMANAL DEL CAMPUS",
    weeklyTheme: "TEMA SEMANAL",
    relationshipProgressTo: "{progress}% PARA {tier}",
    relationshipMaxTier: "NIVEL MÁXIMO",
    relationshipStatus: "RELACIÓN {score} / {endScore}",
    relationshipNextTier: "SIGUIENTE: {tier}",
    relationshipTierStranger: "DESCONOCIDO",
    relationshipTierAcquaintance: "CONOCIDO",
    relationshipTierFriendly: "AMISTOSO",
    relationshipTierFriend: "AMIGO",
    relationshipTierClose: "CERCANO",
    relationshipTierTrusted: "DE CONFIANZA",
    weeklyThemeUpdated: "TEMA SEMANAL ACTUALIZADO",
    conversationThemeUpdated: "Esta conversación ahora sigue el tema actualizado del campus.",
    dismissThemeUpdateNotice: "Descartar aviso de actualización del tema semanal",
    updatedThemeRemainsVisible: "El tema actualizado sigue visible arriba.",
    relationshipWarmer: "+ más cercano",
    relationshipCooler: "- más distante",
    relationshipNowTier: "ahora {tier}",
    awaitingResponse: ":: esperando respuesta...",
    saySomething: "Di algo...",
    sendMessage: "Enviar mensaje",
    backToDirectory: "Volver al directorio",
    statQuickness: "Agilidad",
    statStrength: "Fuerza",
    statMathLogic: "Matemática/Lógica",
    statPresence: "Presencia",
    statLuck: "Suerte",
    statResonance: "Resonancia",
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
    relatedPracticeCopy: "Cet objectif utilise une pratique associée :",
    review: "À REVOIR",
    liveRequestPaused: "REQUÊTE EN DIRECT EN PAUSE",
    liveEnrichmentUnavailable: "ENRICHISSEMENT EN DIRECT INDISPONIBLE",
    offlineStudyMode: "MODE D'ÉTUDE HORS LIGNE",
    liveRequestsPausedCopy:
      "Les requêtes en direct sont temporairement en pause. Le contenu d'étude intégré est actif.",
    bundledStudyContentCopy:
      "Le contenu d'étude intégré est actif. Vous pouvez continuer à répondre aux questions.",
    bulletinCacheIssue: "PROBLÈME DE CACHE DU BULLETIN",
    bulletinCacheExpiry: "CONTENU EXPIRÉ",
    bulletinCacheEvents: "DONNÉES D'ÉVÉNEMENTS",
    bulletinCacheUnreadable: "CACHE ILLISIBLE",
    bulletinCacheMetadata: "MÉTADONNÉES INVALIDES",
    retryLiveEnrichment: "Réessayer l'enrichissement en direct",
    retryingLiveRefresh: "NOUVELLE ACTUALISATION EN DIRECT...",
    retryLiveRefresh: "RÉESSAYER L'ACTUALISATION EN DIRECT",
    mathReasoning: "Raisonnement mathématique",
    languageArts: "Arts du langage",
    science: "Sciences",
    socialStudies: "Sciences sociales",
    studentFileTitle: "DOSSIER ÉTUDIANT",
    studentFileProgress: "SEMAINE {week} · JOUR {day} · {xp} XP",
    studentFileExploration: "{sectors} SECTEURS EXPLORÉS · {objects} OBJETS EXAMINÉS",
    studentCoreStats: "CARACTÉRISTIQUES PRINCIPALES",
    studentInventory: "INVENTAIRE",
    studentInventoryEmpty: "Aucun objet récupéré pour le moment.",
    bulletinLanguage: "LANGUE DU BULLETIN",
    currentBulletinLanguage: "ACTUELLE : {language}",
    deviceDefault: "LANGUE DE L’APPAREIL",
    followDeviceLanguage: "Suivre la langue de l’appareil",
    withdrawRestart: "SE RETIRER ET RECOMMENCER",
    withdrawConfirmTitle: "Quitter l’Académie ?",
    withdrawConfirmMessage: "Votre progression, votre inventaire et vos relations seront effacés.",
    cancel: "Annuler",
    withdraw: "Se retirer",
    englishLanguageName: "Anglais",
    campusDirectoryTitle: "ANNUAIRE DU CAMPUS",
    weeklyCampusTheme: "THÈME HEBDOMADAIRE DU CAMPUS",
    weeklyTheme: "THÈME HEBDOMADAIRE",
    relationshipProgressTo: "{progress}% VERS {tier}",
    relationshipMaxTier: "NIVEAU MAXIMAL",
    relationshipStatus: "RELATION {score} / {endScore}",
    relationshipNextTier: "SUIVANT : {tier}",
    relationshipTierStranger: "INCONNU",
    relationshipTierAcquaintance: "CONNAISSANCE",
    relationshipTierFriendly: "AMICAL",
    relationshipTierFriend: "AMI",
    relationshipTierClose: "PROCHE",
    relationshipTierTrusted: "DE CONFIANCE",
    weeklyThemeUpdated: "THÈME HEBDOMADAIRE MIS À JOUR",
    conversationThemeUpdated: "Cette conversation suit maintenant le thème du campus mis à jour.",
    dismissThemeUpdateNotice: "Fermer l’avis de mise à jour du thème",
    updatedThemeRemainsVisible: "Le thème mis à jour reste visible ci-dessus.",
    relationshipWarmer: "+ plus chaleureux",
    relationshipCooler: "- plus distant",
    relationshipNowTier: "maintenant {tier}",
    awaitingResponse: ":: en attente d’une réponse...",
    saySomething: "Dites quelque chose...",
    sendMessage: "Envoyer un message",
    backToDirectory: "Retour à l’annuaire",
    statQuickness: "Rapidité",
    statStrength: "Force",
    statMathLogic: "Mathématiques/Logique",
    statPresence: "Présence",
    statLuck: "Chance",
    statResonance: "Résonance",
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
    relatedPracticeCopy: "Dieser Fokus nutzt verwandte Übungen:",
    review: "ÜBERPRÜFEN",
    liveRequestPaused: "LIVE-ANFRAGE PAUSIERT",
    liveEnrichmentUnavailable: "LIVE-ERWEITERUNG NICHT VERFÜGBAR",
    offlineStudyMode: "OFFLINE-LERNMODUS",
    liveRequestsPausedCopy:
      "Live-Anfragen sind vorübergehend pausiert. Gebündelte Lerninhalte sind aktiv.",
    bundledStudyContentCopy:
      "Gebündelte Lerninhalte sind aktiv. Du kannst weiter Fragen beantworten.",
    bulletinCacheIssue: "BULLETIN-CACHE-PROBLEM",
    bulletinCacheExpiry: "INHALT ABGELAUFEN",
    bulletinCacheEvents: "EREIGNISDATEN",
    bulletinCacheUnreadable: "CACHE NICHT LESBAR",
    bulletinCacheMetadata: "UNGÜLTIGE METADATEN",
    retryLiveEnrichment: "Live-Erweiterung erneut versuchen",
    retryingLiveRefresh: "LIVE-AKTUALISIERUNG WIRD ERNEUT VERSUCHT...",
    retryLiveRefresh: "LIVE-AKTUALISIERUNG ERNEUT VERSUCHEN",
    mathReasoning: "Mathematisches Denken",
    languageArts: "Sprachkunst",
    science: "Naturwissenschaften",
    socialStudies: "Sozialkunde",
    studentFileTitle: "STUDENTENAKTE",
    studentFileProgress: "WOCHE {week} · TAG {day} · {xp} XP",
    studentFileExploration: "{sectors} BEREICHE ERKUNDET · {objects} OBJEKTE UNTERSUCHT",
    studentCoreStats: "KERNWERTE",
    studentInventory: "INVENTAR",
    studentInventoryEmpty: "Noch keine Gegenstände gesammelt.",
    bulletinLanguage: "SPRACHE DES CAMPUS-NEWSLETTERS",
    currentBulletinLanguage: "AKTUELL: {language}",
    deviceDefault: "GERÄTESPRACHE",
    followDeviceLanguage: "Gerätesprache verwenden",
    withdrawRestart: "AKADEMIE VERLASSEN & NEUSTART",
    withdrawConfirmTitle: "Akademie wirklich verlassen?",
    withdrawConfirmMessage: "Dein Fortschritt, Inventar und Beziehungen werden gelöscht.",
    cancel: "Abbrechen",
    withdraw: "Verlassen",
    englishLanguageName: "Englisch",
    campusDirectoryTitle: "CAMPUS-VERZEICHNIS",
    weeklyCampusTheme: "WÖCHENTLICHES CAMPUS-THEMA",
    weeklyTheme: "WÖCHENTLICHES THEMA",
    relationshipProgressTo: "{progress}% BIS {tier}",
    relationshipMaxTier: "HÖCHSTE STUFE",
    relationshipStatus: "BEZIEHUNG {score} / {endScore}",
    relationshipNextTier: "ALS NÄCHSTES: {tier}",
    relationshipTierStranger: "FREMD",
    relationshipTierAcquaintance: "BEKANNT",
    relationshipTierFriendly: "FREUNDLICH",
    relationshipTierFriend: "FREUND",
    relationshipTierClose: "ENG VERTRAUT",
    relationshipTierTrusted: "VERTRAUENSVOLL",
    weeklyThemeUpdated: "WÖCHENTLICHES THEMA AKTUALISIERT",
    conversationThemeUpdated: "Dieses Gespräch folgt jetzt dem aktualisierten Campus-Thema.",
    dismissThemeUpdateNotice: "Hinweis zur Themenaktualisierung schließen",
    updatedThemeRemainsVisible: "Das aktualisierte Thema bleibt oben sichtbar.",
    relationshipWarmer: "+ wärmer",
    relationshipCooler: "- kühler",
    relationshipNowTier: "jetzt {tier}",
    awaitingResponse: ":: Antwort wird erwartet...",
    saySomething: "Sag etwas...",
    sendMessage: "Nachricht senden",
    backToDirectory: "Zurück zum Verzeichnis",
    statQuickness: "Schnelligkeit",
    statStrength: "Stärke",
    statMathLogic: "Mathe/Logik",
    statPresence: "Präsenz",
    statLuck: "Glück",
    statResonance: "Resonanz",
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
    relatedPracticeCopy: "この重点では関連する練習を使います：",
    review: "復習",
    liveRequestPaused: "ライブリクエストを一時停止",
    liveEnrichmentUnavailable: "ライブ拡張を利用できません",
    offlineStudyMode: "オフライン学習モード",
    liveRequestsPausedCopy:
      "ライブリクエストは一時停止中です。内蔵の学習コンテンツが有効です。",
    bundledStudyContentCopy:
      "内蔵の学習コンテンツが有効です。引き続き問題に回答できます。",
    bulletinCacheIssue: "掲示板キャッシュの問題",
    bulletinCacheExpiry: "期限切れのコンテンツ",
    bulletinCacheEvents: "イベントデータ",
    bulletinCacheUnreadable: "読み取れないキャッシュ",
    bulletinCacheMetadata: "無効なメタデータ",
    retryLiveEnrichment: "ライブ拡張を再試行",
    retryingLiveRefresh: "ライブ更新を再試行中...",
    retryLiveRefresh: "ライブ更新を再試行",
    mathReasoning: "数学的推論",
    languageArts: "言語芸術",
    science: "科学",
    socialStudies: "社会科",
    studentFileTitle: "学生ファイル",
    studentFileProgress: "週 {week} · 日 {day} · {xp} XP",
    studentFileExploration: "{sectors} セクター探索 · {objects} オブジェクト調査",
    studentCoreStats: "主要ステータス",
    studentInventory: "所持品",
    studentInventoryEmpty: "まだアイテムを入手していません。",
    bulletinLanguage: "掲示板の言語",
    currentBulletinLanguage: "現在: {language}",
    deviceDefault: "端末の言語設定",
    followDeviceLanguage: "端末の言語に合わせる",
    withdrawRestart: "退学して再スタート",
    withdrawConfirmTitle: "アカデミーを退学しますか？",
    withdrawConfirmMessage: "進行状況、所持品、関係性がすべて消去されます。",
    cancel: "キャンセル",
    withdraw: "退学する",
    englishLanguageName: "英語",
    campusDirectoryTitle: "キャンパス名簿",
    weeklyCampusTheme: "今週のキャンパステーマ",
    weeklyTheme: "今週のテーマ",
    relationshipProgressTo: "{progress}% 次のランク: {tier}",
    relationshipMaxTier: "最高ランク",
    relationshipStatus: "関係度 {score} / {endScore}",
    relationshipNextTier: "次のランク: {tier}",
    relationshipTierStranger: "初対面",
    relationshipTierAcquaintance: "知人",
    relationshipTierFriendly: "友好的",
    relationshipTierFriend: "友人",
    relationshipTierClose: "親しい",
    relationshipTierTrusted: "信頼",
    weeklyThemeUpdated: "テーマが更新されました",
    conversationThemeUpdated: "この会話は更新後のキャンパステーマに沿って進みます。",
    dismissThemeUpdateNotice: "テーマ更新のお知らせを閉じる",
    updatedThemeRemainsVisible: "更新されたテーマは上に表示されています。",
    relationshipWarmer: "+ 親密になった",
    relationshipCooler: "- 距離ができた",
    relationshipNowTier: "現在: {tier}",
    awaitingResponse: ":: 返答を待っています...",
    saySomething: "何か話してください...",
    sendMessage: "メッセージを送信",
    backToDirectory: "名簿に戻る",
    statQuickness: "敏捷性",
    statStrength: "強さ",
    statMathLogic: "数学・論理",
    statPresence: "存在感",
    statLuck: "運",
    statResonance: "共鳴",
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

export function formatMobileCopy(
  key: MobileCopyKey,
  locale: string | null | undefined,
  values: Record<string, string | number>,
): string {
  let copy = getMobileCopy(key, locale);
  for (const [name, value] of Object.entries(values)) {
    copy = copy.split(`{${name}}`).join(String(value));
  }
  return copy;
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