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
  const setBulletinLocalePreference = vi.fn((locale: string | null) => {
    state.bulletinLocalePreference = locale;
    state.bulletinLocale = locale ?? state.deviceLocale;
  });

  return {
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
  STAT_DEFS: [],
  useGame: gameContextMock.useGame,
}));

vi.mock("react-native", async () => ({
  ...(await import("./react-native-test-mock")),
  Alert: { alert: vi.fn() },
}));

vi.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}));

vi.mock("@/components/CrtButton", () => ({
  CrtButton: () => null,
}));

vi.mock("@/components/StatBar", () => ({
  StatBar: () => null,
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
import { BULLETIN_LOCALE_OPTIONS } from "../constants/locales";

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
    expect(visibleOptions).toContain("DEVICE DEFAULT");
    for (const option of BULLETIN_LOCALE_OPTIONS) {
      expect(visibleOptions).toContain(option.label);
    }
    expect(findRadio(renderer, "English").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(findRadio(renderer, "DEVICE DEFAULT").props.accessibilityState).toEqual({
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
    expect(findRadio(renderer, "DEVICE DEFAULT").props.accessibilityState).toEqual({
      selected: false,
    });

    act(() => renderer.unmount());
  });

  it("resets the selector to Device default", () => {
    gameContextMock.state.bulletinLocale = "es";
    gameContextMock.state.bulletinLocalePreference = "es";
    const renderer = renderStudentFile();

    act(() => {
      findRadio(renderer, "DEVICE DEFAULT").props.onPress();
    });

    expect(gameContextMock.setBulletinLocalePreference).toHaveBeenCalledWith(null);
    expect(gameContextMock.state.bulletinLocale).toBe("ja");
    act(() => renderer.update(<StatsScreen />));

    expect(findRadio(renderer, "DEVICE DEFAULT").props.accessibilityState).toEqual({
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