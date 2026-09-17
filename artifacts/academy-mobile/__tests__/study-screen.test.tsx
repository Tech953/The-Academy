import React from "react";
import TestRenderer, {
  act,
  type ReactTestInstance,
} from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import {
  generateOfflineContentPack,
  isQuestionFocusMatched,
  type ContentPack,
  type StudyQuestion,
} from "@workspace/game-engine";
import { resolveContentPackRefresh } from "../lib/contentPackFallback";

const gameContextMock = vi.hoisted(() => ({
  useGame: vi.fn(),
}));

vi.mock("@/context/GameContext", () => ({
  useGame: gameContextMock.useGame,
}));

vi.mock("react-native", async () => import("./react-native-test-mock"));

vi.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#000000",
    foreground: "#00ff00",
    primary: "#00ff00",
    primaryForeground: "#000000",
    secondary: "#000000",
    secondaryForeground: "#00ff00",
    muted: "#000000",
    mutedForeground: "#b3b3b3",
    accent: "#ffff00",
    accentForeground: "#000000",
    destructive: "#ff0000",
    destructiveForeground: "#000000",
    border: "#00ff00",
    input: "#000000",
    text: "#00ff00",
    tint: "#00ff00",
    card: "#000000",
    cardForeground: "#00ff00",
    radius: 4,
  }),
}));

import StudyScreen from "../app/(tabs)/study";

const focusTopics = ["Linear Equations"];
const connectedFocusTopics = ["Ratios & Proportions"];

const focusedQuestion: StudyQuestion = {
  id: "focused-linear-equation",
  subject: "math",
  topic: "Linear Equations",
  type: "multiple_choice",
  difficulty: 2,
  question: "Solve 2x + 4 = 10.",
  choices: ["x = 2", "x = 3", "x = 4"],
  answer: "x = 3",
  explanation: "Subtract 4 and divide by 2.",
};

const generalQuestion: StudyQuestion = {
  id: "general-fractions",
  subject: "math",
  topic: "Fractions & Ratios",
  type: "multiple_choice",
  difficulty: 1,
  question: "Which fraction equals one half?",
  choices: ["1/2", "1/3", "2/3"],
  answer: "1/2",
  explanation: "One half is written as 1/2.",
};

const connectedFocusedQuestion: StudyQuestion = {
  ...focusedQuestion,
  id: "connected-ratios",
  topic: connectedFocusTopics[0],
  question: "What is the ratio of 2 to 4 in simplest form?",
  choices: ["1:2", "2:1", "2:4"],
  answer: "1:2",
  explanation: "Divide both terms by 2.",
};

function makeStudyPack(
  version: string,
  topic: string,
  generatedBy: ContentPack["generatedBy"],
): ContentPack {
  const basePack = generateOfflineContentPack(1);
  return {
    ...basePack,
    version,
    generatedBy,
    gedFocusAreas: [
      {
        ...basePack.gedFocusAreas[0],
        subject: "Math Reasoning",
        topic,
      },
      basePack.gedFocusAreas[1],
    ],
  };
}

function renderStudyScreen(
  pack = makeStudyPack("offline-pack", focusTopics[0], "deterministic"),
  questions: StudyQuestion[] = [focusedQuestion, generalQuestion],
) {
  const onAnswer = vi.fn(() => true);
  gameContextMock.useGame.mockReturnValue({
    isOnline: false,
    enrichmentStatus: "offline",
    day: 1,
    week: 1,
    studyProgress: {
      math: { correct: 0, answered: 0 },
      language_arts: { correct: 0, answered: 0 },
      science: { correct: 0, answered: 0 },
      social_studies: { correct: 0, answered: 0 },
    },
    contentPack: pack,
    getQuizSet: vi.fn(() => questions),
    answerQuestion: onAnswer,
  });

  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<StudyScreen />);
  });
  return { onAnswer, renderer };
}

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map((child) =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function visibleText(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll((instance) => String(instance.type) === "Text")
    .map(textContent);
}

function openMathStudy(renderer: TestRenderer.ReactTestRenderer) {
  const subjectButton = renderer.root
    .findAll((instance) => String(instance.type) === "Pressable")
    .find((pressable) => textContent(pressable).includes("FOCUS: Linear Equations"));
  expect(subjectButton).toBeDefined();

  act(() => {
    subjectButton?.props.onPress();
  });
}

describe("Study question focus badges", () => {
  it("labels a focus-matched question as weekly focus", () => {
    const { renderer } = renderStudyScreen();
    openMathStudy(renderer);

    expect(isQuestionFocusMatched(focusedQuestion, focusTopics)).toBe(true);
    expect(visibleText(renderer)).toContain("WEEKLY FOCUS");
  });

  it("keeps a non-matching question visible and answerable as general practice", () => {
    const { onAnswer, renderer } = renderStudyScreen();
    openMathStudy(renderer);

    expect(isQuestionFocusMatched(generalQuestion, focusTopics)).toBe(false);
    expect(visibleText(renderer)).toContain("GENERAL PRACTICE");

    const generalAnswer = renderer.root
      .findAll((instance) => String(instance.type) === "Pressable")
      .find((pressable) => textContent(pressable).includes("1/2"));
    expect(generalAnswer).toBeDefined();
    expect(generalAnswer?.props.disabled).toBe(false);

    act(() => {
      generalAnswer?.props.onPress();
    });

    expect(visibleText(renderer)).toContain(
      "CORRECT — One half is written as 1/2.",
    );
    expect(onAnswer).toHaveBeenCalledWith(generalQuestion, "1/2");
  });

  it("updates the connected focus topic and quiz cards in one visible transition", async () => {
    const { renderer } = renderStudyScreen();
    openMathStudy(renderer);

    const connectedPack = makeStudyPack(
      "connected-pack",
      connectedFocusTopics[0],
      "gpt",
    );
    const refresh = await resolveContentPackRefresh(
      async () => connectedPack,
      makeStudyPack("offline-pack", focusTopics[0], "deterministic"),
      1,
    );
    expect(refresh.source).toBe("online");

    gameContextMock.useGame.mockReturnValue({
      isOnline: true,
      enrichmentStatus: "live",
      day: 1,
      week: 1,
      studyProgress: {
        math: { correct: 0, answered: 0 },
        language_arts: { correct: 0, answered: 0 },
        science: { correct: 0, answered: 0 },
        social_studies: { correct: 0, answered: 0 },
      },
      contentPack: refresh.pack,
      getQuizSet: vi.fn(() => [connectedFocusedQuestion, generalQuestion]),
      answerQuestion: vi.fn(() => true),
    });

    act(() => {
      renderer.update(<StudyScreen />);
    });

    const currentText = visibleText(renderer);
    expect(currentText).toContain("RATIOS & PROPORTIONS");
    expect(currentText).toContain("WEEKLY FOCUS");
    expect(currentText).not.toContain("LINEAR EQUATIONS");
    expect(currentText).not.toContain("Solve 2x + 4 = 10.");
  });
});