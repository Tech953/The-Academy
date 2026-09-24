import React from "react";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import MessagesApp from "./MessagesApp";

const mocked = vi.hoisted(() => {
  const timestamp = new Date("2026-09-17T12:00:00.000Z");
  type NewMessage = {
    from: string;
    fromTitle?: string;
    content: string;
    avatar?: string;
    isFromPlayer: boolean;
    conversationId: string;
  };
  type TestMessage = NewMessage & {
    id: string;
    timestamp: Date;
    read: boolean;
  };
  type TestConversation = {
    id: string;
    participantName: string;
    participantTitle: string;
    messages: TestMessage[];
    lastActivity: Date;
  };
  const failureMessage: TestMessage = {
    id: "voice-failure",
    from: "NPC",
    content: "[Voice response failed. Please retry this message.]",
    timestamp,
    read: true,
    isFromPlayer: false,
    conversationId: "npc-1",
  };
  const conversation: TestConversation = {
    id: "npc-1",
    participantName: "NPC",
    participantTitle: "Student",
    messages: [failureMessage],
    lastActivity: timestamp,
  };
  const gameState = {
    messages: [failureMessage] as TestMessage[],
    conversations: [conversation] as TestConversation[],
    markMessageRead: vi.fn(),
    unreadMessageCount: 0,
    sendMessage: vi.fn(),
    addMessage: vi.fn((_message: NewMessage) => {}),
    removeMessage: vi.fn((_id: string) => {}),
    character: { name: "Student" },
    isEnrolled: true,
  };
  gameState.addMessage.mockImplementation(message => {
    const newMessage = {
      ...message,
      id: `added-${gameState.messages.length}`,
      timestamp: new Date(),
      read: false,
    };
    gameState.messages = [newMessage, ...gameState.messages];
    gameState.conversations = gameState.conversations.map(existing =>
      existing.participantName === message.conversationId
        ? {
            ...existing,
            messages: [...existing.messages, newMessage],
            lastActivity: newMessage.timestamp,
          }
        : existing,
    );
  });
  gameState.removeMessage.mockImplementation(id => {
    gameState.messages = gameState.messages.filter(message => message.id !== id);
    gameState.conversations = gameState.conversations.map(existing => ({
      ...existing,
      messages: existing.messages.filter(message => message.id !== id),
    }));
  });
  return {
    failureMessage,
    conversation,
    gameState,
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
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  mocked.gameState.messages = [{ ...mocked.failureMessage }];
  mocked.gameState.conversations = [{
    ...mocked.conversation,
    messages: [{ ...mocked.failureMessage }],
  }];
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

function openFailureConversation(): TestRenderer.ReactTestRenderer {
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
  return renderer;
}

class FakeMediaRecorder {
  static current: FakeMediaRecorder | null = null;
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(_stream: MediaStream) {
    FakeMediaRecorder.current = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["replacement audio"], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.(new Event("stop"));
  }
}

describe("ChatLink voice failure messages", () => {
  it("records and submits a replacement voice message, then resolves the old failure", async () => {
    const trackStop = vi.fn();
    const mediaStream = {
      getTracks: () => [{ stop: trackStop }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => mediaStream);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    const events = [
      { type: "user_transcript", data: "Replacement request" },
      { type: "transcript", data: "Here is the answer." },
      { type: "done", transcript: "Here is the answer." },
    ];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "/api/conversations") {
        return new Response(JSON.stringify({ id: 41 }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }
      if (String(input) === "/api/conversations/41/messages") {
        return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(""), {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        });
      }
      throw new Error(`Unexpected request: ${String(input)} ${init?.method ?? "GET"}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const renderer = openFailureConversation();
    await act(async () => {
      findButton(renderer, "RETRY").props.onClick();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(textContent(renderer.root)).toContain("Recording. Select STOP & SEND when you finish.");

    await act(async () => {
      renderer.root.findByProps({ "data-testid": "button-stop-send-voice-voice-failure" })
        .props.onClick();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(trackStop).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const uploadCall = fetchMock.mock.calls[1];
    expect(String(uploadCall[0])).toBe("/api/conversations/41/messages");
    const uploadBody = JSON.parse(String(uploadCall[1]?.body)) as { audio: string };
    expect(atob(uploadBody.audio)).toBe("replacement audio");
    expect(mocked.gameState.removeMessage).toHaveBeenCalledWith("voice-failure");
    expect(mocked.gameState.addMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      content: "Replacement request",
      isFromPlayer: true,
      conversationId: "NPC",
    }));
    expect(mocked.gameState.addMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      content: "Here is the answer.",
      isFromPlayer: false,
      conversationId: "NPC",
    }));
    act(() => {
      renderer.update(<MessagesApp />);
    });
    expect(textContent(renderer.root)).not.toContain("VOICE RESPONSE FAILED");
    expect(textContent(renderer.root)).toContain("Replacement request");
    expect(textContent(renderer.root)).toContain("Here is the answer.");
  });

  it("shows an actionable fallback when recording is unsupported", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("MediaRecorder", undefined);
    const renderer = openFailureConversation();

    await act(async () => {
      findButton(renderer, "RETRY").props.onClick();
      await Promise.resolve();
    });

    expect(textContent(renderer.root)).toContain("supported browser on a secure connection");
    expect(textContent(renderer.root)).toContain("send a text message below");
    expect(renderer.root.findByProps({ "data-testid": "input-chat-message" })).toBeDefined();
    expect(mocked.gameState.addMessage).not.toHaveBeenCalled();
    expect(mocked.gameState.sendMessage).not.toHaveBeenCalled();
  });

  it("explains how to recover when microphone permission is denied", async () => {
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
        }),
      },
    });
    const renderer = openFailureConversation();

    await act(async () => {
      findButton(renderer, "RETRY").props.onClick();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(textContent(renderer.root)).toContain("Microphone access was denied");
    expect(textContent(renderer.root)).toContain("browser settings");
    expect(textContent(renderer.root)).toContain("send a text message below");
  });
});