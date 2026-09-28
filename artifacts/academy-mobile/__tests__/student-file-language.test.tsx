import React from "react";
import TestRenderer, {
  act,
  type ReactTestInstance,
} from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const gameContextMock = vi.hoisted(() => {
  const state = {
    bulletinLocale: "en",
    bulletinLocalePreference: "en" as string | null,
    deviceLocale: "ja",
  };
  const alertSpy = vi.fn();
  const setBulletinLocalePreference = vi.fn((locale: string | null) => {
    state.bulletinLocalePreference = locale;
    state.bulletinLocale = locale ?? state.deviceLocale;
  });

  return {
    alertSpy,
    state,
    setBulletinLocalePreference,
    useGame: vi.fn(() => ({
      isOnline: false,
      enrichmentStatus: "offline",
      playerName: "Mira",
      day: 1,
      week: 1,
      xp: 0,
      stats: {},
      inventory: [],
      visitedLocationIds: [],
      examinedIds: [],
      resetGame: vi.fn(),
      bulletinLocale: state.bulletinLocale,
      bulletinLocalePreference: state.bulletinLocalePreference,
      setBulletinLocalePreference,
    })),
  };
});

vi.mock("@/context/GameContext", () => ({
  STAT_DEFS: [
    { key: "quickness", label: "Quickness", abbr: "QCK" },
    { key: "strength", label: "Strength", abbr: "STR" },
    { key: "mathLogic", label: "Math/Logic", abbr: "MTH" },
    { key: "presence", label: "Presence", abbr: "PRS" },
    { key: "luck", label: "Luck", abbr: "LCK" },
    { key: "resonance", label: "Resonance", abbr: "RES" },
  ],
  useGame: gameContextMock.useGame,
}));

vi.mock("react-native", async () => ({
  ...(await import("./react-native-test-mock")),
  Alert: { alert: gameContextMock.alertSpy },
}));

vi.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

vi.mock("@/components/CrtButton", () => ({
  CrtButton: ({
    label,
    onPress,
  }: {
    label: string;
    onPress?: () => void;
  }) =>
    React.createElement(
      "button",
      { "data-testid": "student-file-reset", onPress },
      label,
    ),
}));

vi.mock("@/components/StatBar", () => ({
  StatBar: ({ label }: { label: string }) =>
    React.createElement("span", { "data-testid": "student-file-stat" }, label),
}));

vi.mock("@/components/StatusBadge", () => ({
  StatusBadge: () => null,
}));

vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#000000",
    foreground: "#00ff00",
    primary: "#00ff00",
    mutedForeground: "#b3b3b3",
    accent: "#ffff00",
    border: "#00ff00",
  }),
}));

import StatsScreen from "../app/(tabs)/stats";
import {
  BULLETIN_LOCALE_OPTIONS,
  formatMobileCopy,
  getMobileCopy,
  MOBILE_COPY_CATALOG,
  SUPPORTED_LOCALES,
  type MobileCopyKey,
} from "../constants/locales";

const STUDENT_FILE_COPY_KEYS = [
  "studentFileTitle",
  "studentCoreStats",
  "statQuickness",
  "statStrength",
  "statMathLogic",
  "statPresence",
  "statLuck",
  "statResonance",
  "studentInventory",
  "studentInventoryEmpty",
  "bulletinLanguage",
  "deviceDefault",
  "followDeviceLanguage",
  "withdrawRestart",
] as const satisfies readonly MobileCopyKey[];

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map((child) =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function renderStudentFile() {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<StatsScreen />);
  });
  return renderer;
}

function findRadio(
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
): ReactTestInstance {
  const radio = renderer.root
    .findAll(
      (instance) =>
        String(instance.type) === "Pressable" &&
        instance.props.accessibilityRole === "radio",
    )
    .find((instance) => textContent(instance).includes(label));

  if (!radio) throw new Error(`Could not find radio option: ${label}`);
  return radio;
}

describe("Student File bulletin language selector", () => {
  beforeEach(() => {
    gameContextMock.state.bulletinLocale = "en";
    gameContextMock.state.bulletinLocalePreference = "en";
    gameContextMock.state.deviceLocale = "ja";
    gameContextMock.setBulletinLocalePreference.mockClear();
    gameContextMock.alertSpy.mockClear();
  });

  it("renders Device default and every supported bulletin language", () => {
    const renderer = renderStudentFile();
    const radios = renderer.root.findAll(
      (instance) =>
        String(instance.type) === "Pressable" &&
        instance.props.accessibilityRole === "radio",
    );
    const visibleOptions = radios.map(textContent).join("\n");

    expect(radios).toHaveLength(BULLETIN_LOCALE_OPTIONS.length + 1);
    expect(visibleOptions).toContain(getMobileCopy("deviceDefault", "en"));
    for (const option of BULLETIN_LOCALE_OPTIONS) {
      expect(visibleOptions).toContain(option.label);
    }
    expect(findRadio(renderer, "English").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(findRadio(renderer, getMobileCopy("deviceDefault", "en")).props.accessibilityState).toEqual({
      selected: false,
    });

    act(() => renderer.unmount());
  });

  it("selects the chosen language and calls the provider setter", () => {
    const renderer = renderStudentFile();

    act(() => {
      findRadio(renderer, "日本語").props.onPress();
    });

    expect(gameContextMock.setBulletinLocalePreference).toHaveBeenCalledWith("ja");
    act(() => renderer.update(<StatsScreen />));

    expect(findRadio(renderer, "日本語").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(findRadio(renderer, "English").props.accessibilityState).toEqual({
      selected: false,
    });
    expect(findRadio(renderer, getMobileCopy("deviceDefault", "ja")).props.accessibilityState).toEqual({
      selected: false,
    });

    act(() => renderer.unmount());
  });

  it("resets the selector to Device default", () => {
    gameContextMock.state.bulletinLocale = "es";
    gameContextMock.state.bulletinLocalePreference = "es";
    const renderer = renderStudentFile();

    act(() => {
      findRadio(renderer, getMobileCopy("deviceDefault", "es")).props.onPress();
    });

    expect(gameContextMock.setBulletinLocalePreference).toHaveBeenCalledWith(null);
    expect(gameContextMock.state.bulletinLocale).toBe("ja");
    act(() => renderer.update(<StatsScreen />));

    expect(findRadio(renderer, getMobileCopy("deviceDefault", "ja")).props.accessibilityState).toEqual({
      selected: true,
    });
    for (const option of BULLETIN_LOCALE_OPTIONS) {
      expect(findRadio(renderer, option.label).props.accessibilityState).toEqual({
        selected: false,
      });
    }

    act(() => renderer.unmount());
  });
});

describe("Student File localized copy", () => {
  it.each(SUPPORTED_LOCALES)(
    "renders headings, inventory, stats, and reset copy in %s",
    (locale) => {
      gameContextMock.state.bulletinLocale = locale;
      gameContextMock.state.bulletinLocalePreference = locale;
      gameContextMock.alertSpy.mockClear();

      const renderer = renderStudentFile();
      const visibleCopy = textContent(renderer.root);

      for (const key of STUDENT_FILE_COPY_KEYS) {
        const translatedCopy = MOBILE_COPY_CATALOG[locale]?.[key];
        expect(translatedCopy, `${locale} is missing ${key}`).toBeTruthy();
        expect(visibleCopy).toContain(translatedCopy);
      }
      expect(visibleCopy).toContain(
        formatMobileCopy("studentFileProgress", locale, {
          week: 1,
          day: 1,
          xp: 0,
        }),
      );
      expect(visibleCopy).toContain(
        formatMobileCopy("studentFileExploration", locale, {
          sectors: 0,
          objects: 0,
        }),
      );
      expect(visibleCopy).toContain(
        formatMobileCopy("currentBulletinLanguage", locale, {
          language: BULLETIN_LOCALE_OPTIONS.find((option) => option.value === locale)!.label,
        }),
      );

      const resetButton = renderer.root.findByProps({
        "data-testid": "student-file-reset",
      });
      expect(textContent(resetButton)).toBe(getMobileCopy("withdrawRestart", locale));
      act(() => resetButton.props.onPress());

      const [title, message, actions] =
        gameContextMock.alertSpy.mock.calls[0] as unknown as [
          string,
          string,
          Array<Record<string, unknown>>,
        ];
      expect(title).toBe(getMobileCopy("withdrawConfirmTitle", locale));
      expect(message).toBe(getMobileCopy("withdrawConfirmMessage", locale));
      expect(actions.map((action) => action.text)).toEqual([
        getMobileCopy("cancel", locale),
        getMobileCopy("withdraw", locale),
      ]);
      expect(actions[0]).toMatchObject({ style: "cancel" });
      expect(actions[1]).toMatchObject({ style: "destructive" });
      expect(typeof actions[1].onPress).toBe("function");

      act(() => renderer.unmount());
    },
  );

  it("uses English fallback for missing translated Student File copy", () => {
    gameContextMock.state.bulletinLocale = "es";
    gameContextMock.state.bulletinLocalePreference = "es";
    const spanishCopy = MOBILE_COPY_CATALOG.es;
    expect(spanishCopy).toBeDefined();

    const previousTitle = spanishCopy!.studentFileTitle;
    const previousInventory = spanishCopy!.studentInventoryEmpty;
    delete spanishCopy!.studentFileTitle;
    delete spanishCopy!.studentInventoryEmpty;

    try {
      const renderer = renderStudentFile();
      const visibleCopy = textContent(renderer.root);

      expect(visibleCopy).toContain(getMobileCopy("studentFileTitle", "en"));
      expect(visibleCopy).toContain(getMobileCopy("studentInventoryEmpty", "en"));
      act(() => renderer.unmount());
    } finally {
      spanishCopy!.studentFileTitle = previousTitle;
      spanishCopy!.studentInventoryEmpty = previousInventory;
    }
  });
});