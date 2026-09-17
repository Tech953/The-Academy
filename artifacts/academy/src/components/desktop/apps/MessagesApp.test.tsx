import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import MessagesApp from "./MessagesApp";

const mocked = vi.hoisted(() => {
  const timestamp = new Date("2026-09-17T12:00:00.000Z");
  const failureMessage = {
    id: "voice-failure",
    from: "NPC",
    content: "[Voice response failed. Please retry this message.]",
    timestamp,
    read: true,
    isFromPlayer: false,
    conversationId: "npc-1",
  };
  const conversation = {
    id: "npc-1",
    participantName: "NPC",
    participantTitle: "Student",
    messages: [failureMessage],
    lastActivity: timestamp,
  };
  return {
    gameState: {
      messages: [failureMessage],
      conversations: [conversation],
      markMessageRead: vi.fn(),
      unreadMessageCount: 0,
      sendMessage: vi.fn(),
      addMessage: vi.fn(),
      character: { name: "Student" },
      isEnrolled: true,
    },
    processInteraction: vi.fn(),
  };
});

vi.mock("@/contexts/GameStateContext", () => ({
  useGameState: () => mocked.gameState,
}));

vi.mock("@/hooks/useRadiantAI", () => ({
  useRadiantAI: () => ({ processInteraction: mocked.processInteraction }),
}));

vi.mock("./NPCDirectoryPanel", () => ({
  default: () => null,
}));

afterEach(() => {
  vi.clearAllMocks();
});

function textContent(instance: ReactTestInstance): string {
  return instance.children
    .map(child =>
      typeof child === "string" ? child : textContent(child as ReactTestInstance),
    )
    .join("");
}

function findButton(
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
): ReactTestInstance {
  const button = renderer.root
    .findAll(instance => String(instance.type) === "button")
    .find(instance => textContent(instance).includes(label));
  expect(button).toBeDefined();
  return button!;
}

describe("ChatLink voice failure messages", () => {
  it("shows RETRY guidance without creating a duplicate message", () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<MessagesApp />);
    });

    const conversationRow = renderer.root.findAll(instance =>
      Boolean(instance.props.onClick) && textContent(instance).includes("NPC"),
    )[0];
    expect(conversationRow).toBeDefined();

    act(() => {
      conversationRow.props.onClick();
    });

    expect(textContent(renderer.root)).toContain("VOICE RESPONSE FAILED");
    const retryButton = findButton(renderer, "RETRY");

    act(() => {
      retryButton.props.onClick();
    });

    expect(textContent(renderer.root)).toContain(
      "RECORD AGAIN: Use your voice input to record the original message",
    );
    expect(mocked.gameState.addMessage).not.toHaveBeenCalled();
    expect(mocked.gameState.sendMessage).not.toHaveBeenCalled();
  });
});