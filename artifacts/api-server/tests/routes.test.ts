import express, { type Express } from "express";
import type OpenAI from "openai";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerRoutes } from "../src/routes/routes";
import type { IStorage } from "../src/storage";
import { registerChatRoutes } from "../src/replit_integrations/chat/routes";
import type { ChatStorage } from "../src/replit_integrations/chat/storage";
import { registerAudioRoutes } from "../src/replit_integrations/audio/routes";
import { registerImageRoutes } from "../src/replit_integrations/image/routes";

type TestServer = {
  server: Server;
  baseUrl: string;
};

const openServers = new Set<Server>();
const requestFetch = globalThis.fetch.bind(globalThis);

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    [...openServers].map(
      server =>
        new Promise<void>(resolve => {
          server.close(() => resolve());
        }),
    ),
  );
  openServers.clear();
});

async function startApp(register: (app: Express) => void | Promise<void>): Promise<TestServer> {
  const app = express();
  app.use(express.json());
  await register(app);

  const server = app.listen(0);
  openServers.add(server);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function request(
  testServer: TestServer,
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: any; text: string }> {
  const response = await requestFetch(`${testServer.baseUrl}${path}`, init);
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  return {
    response,
    text,
    body: text && contentType.includes("application/json") ? JSON.parse(text) : undefined,
  };
}

function makeStorage(overrides: Partial<Record<keyof IStorage, unknown>> = {}): IStorage {
  return {
    getUser: vi.fn(async () => undefined),
    getUserByUsername: vi.fn(async () => undefined),
    createUser: vi.fn(),
    getCharacter: vi.fn(async () => undefined),
    getCharactersByUser: vi.fn(async () => []),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(async () => undefined),
    deleteCharacter: vi.fn(async () => false),
    getLocation: vi.fn(async () => undefined),
    getAllLocations: vi.fn(async () => []),
    getNPC: vi.fn(async () => undefined),
    getNPCsInLocation: vi.fn(async () => []),
    getAllNPCs: vi.fn(async () => []),
    getItem: vi.fn(async () => undefined),
    getAllItems: vi.fn(async () => []),
    saveGameSession: vi.fn(),
    getLatestGameSession: vi.fn(async () => undefined),
    getCourse: vi.fn(async () => undefined),
    getAllCourses: vi.fn(async () => []),
    getCoursesByDepartment: vi.fn(async () => []),
    getEnrollment: vi.fn(async () => undefined),
    getEnrollmentsByCourse: vi.fn(async () => []),
    getEnrollmentsByCharacter: vi.fn(async () => []),
    createEnrollment: vi.fn(),
    updateEnrollment: vi.fn(async () => undefined),
    getAssignment: vi.fn(async () => undefined),
    getAssignmentsByCourse: vi.fn(async () => []),
    getGraduationPathway: vi.fn(async () => undefined),
    getAllGraduationPathways: vi.fn(async () => []),
    getAcademicProgress: vi.fn(async () => undefined),
    createAcademicProgress: vi.fn(),
    updateAcademicProgress: vi.fn(async () => undefined),
    getTextbook: vi.fn(async () => undefined),
    getTextbookByCourse: vi.fn(async () => undefined),
    getAllTextbooks: vi.fn(async () => []),
    getLecture: vi.fn(async () => undefined),
    getLecturesByCourse: vi.fn(async () => []),
    getLectureByWeek: vi.fn(async () => undefined),
    getReadingProgress: vi.fn(async () => undefined),
    updateReadingProgress: vi.fn(),
    ...overrides,
  } as unknown as IStorage;
}

function makeChatStorage(overrides: Partial<ChatStorage> = {}): ChatStorage {
  return {
    getConversation: vi.fn(async () => undefined),
    getAllConversations: vi.fn(async () => []),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(async () => undefined),
    getMessagesByConversation: vi.fn(async () => []),
    createMessage: vi.fn(),
    ...overrides,
  };
}

function makeChatOpenAI(create: ReturnType<typeof vi.fn>) {
  return {
    chat: { completions: { create } },
  } as unknown as Pick<OpenAI, "chat">;
}

describe("main API routes", () => {
  it("returns a shaped 404 for a missing character and stops before mutation", async () => {
    const getCharacter = vi.fn(async () => undefined);
    const updateCharacter = vi.fn();
    const storage = makeStorage({ getCharacter, updateCharacter });
    const testServer = await startApp(app =>
      registerRoutes(app, { storage, skipContentRefresh: true }),
    );

    const result = await request(testServer, "/api/characters/missing");

    expect(result.response.status).toBe(404);
    expect(result.body).toEqual({ error: "Character not found" });
    expect(getCharacter).toHaveBeenCalledWith("missing");
    expect(updateCharacter).not.toHaveBeenCalled();
  });

  it("rejects invalid character data without calling storage", async () => {
    const createCharacter = vi.fn();
    const storage = makeStorage({ createCharacter });
    const testServer = await startApp(app =>
      registerRoutes(app, { storage, skipContentRefresh: true }),
    );

    const result = await request(testServer, "/api/characters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: 42 }),
    });

    expect(result.response.status).toBe(400);
    expect(result.body.error).toBe("Invalid character data");
    expect(Array.isArray(result.body.details)).toBe(true);
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it("persists a valid game save and returns the stored session", async () => {
    const savedSession = {
      id: "session-1",
      characterId: "character-1",
      sessionData: { day: 4 },
    };
    const saveGameSession = vi.fn(async () => savedSession);
    const storage = makeStorage({ saveGameSession });
    const testServer = await startApp(app =>
      registerRoutes(app, { storage, skipContentRefresh: true }),
    );

    const result = await request(testServer, "/api/game/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ characterId: "character-1", gameState: { day: 4 } }),
    });

    expect(result.response.status).toBe(200);
    expect(result.body).toEqual(savedSession);
    expect(saveGameSession).toHaveBeenCalledWith("character-1", { day: 4 });
  });

  it("returns a storage error contract when a list query fails", async () => {
    const getAllLocations = vi.fn(async () => {
      throw new Error("storage unavailable");
    });
    const storage = makeStorage({ getAllLocations });
    const testServer = await startApp(app =>
      registerRoutes(app, { storage, skipContentRefresh: true }),
    );

    const result = await request(testServer, "/api/locations");

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({ error: "Failed to fetch locations" });
  });

  it("rejects invalid AI input before calling the mocked model", async () => {
    const create = vi.fn();
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/ai/describe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locationName: "Library" }),
    });

    expect(result.response.status).toBe(400);
    expect(result.body).toEqual({ error: "type and locationName are required" });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns a successful mocked AI description", async () => {
    const create = vi.fn(async () => ({
      choices: [{ message: { content: "A quiet room of lamps and old maps." } }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/ai/describe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "location", locationName: "Library" }),
    });

    expect(result.response.status).toBe(200);
    expect(result.body).toEqual({ description: "A quiet room of lamps and old maps." });
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("RSS and URL metadata routes", () => {
  it("rejects invalid URL metadata input without calling fetch", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(testServer, "/api/fetch-url-meta?url=not-a-url");

    expect(result.response.status).toBe(400);
    expect(result.body).toEqual({ error: "Invalid or missing URL parameter" });
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("returns a stable error when URL metadata fetching fails upstream", async () => {
    const upstreamFetch = vi.fn(async () => {
      throw new Error("upstream unavailable");
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Farticle",
    );

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({
      error: "Could not retrieve URL: upstream unavailable",
    });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("returns the upstream status when URL metadata responds with an error", async () => {
    const upstreamFetch = vi.fn(async () => new Response("temporarily unavailable", { status: 503 }));
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Farticle",
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "upstream 503" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("returns a stable error when an RSS feed request fails upstream", async () => {
    const upstreamFetch = vi.fn(async () => {
      throw new Error("feed unavailable");
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/rss?url=https%3A%2F%2Fnasa.gov%2Ffeed.xml",
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "feed unavailable" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("returns the upstream status when an RSS feed responds with an error", async () => {
    const upstreamFetch = vi.fn(async () => new Response("temporarily unavailable", { status: 503 }));
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/rss?url=https%3A%2F%2Fnasa.gov%2Ffeed.xml",
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "upstream 503" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });
});

describe("chat, image, and audio integration routes", () => {
  it("returns 404 for a missing conversation without reading its messages", async () => {
    const getConversation = vi.fn(async () => undefined);
    const getMessagesByConversation = vi.fn();
    const testServer = await startApp(app =>
      registerChatRoutes(app, {
        storage: makeChatStorage({ getConversation, getMessagesByConversation }),
        openai: makeChatOpenAI(vi.fn()),
      }),
    );

    const result = await request(testServer, "/api/conversations/99");

    expect(result.response.status).toBe(404);
    expect(result.body).toEqual({ error: "Conversation not found" });
    expect(getMessagesByConversation).not.toHaveBeenCalled();
  });

  it("returns JSON for a chat storage failure before streaming starts", async () => {
    const createMessage = vi.fn(async () => {
      throw new Error("write failed");
    });
    const create = vi.fn();
    const testServer = await startApp(app =>
      registerChatRoutes(app, {
        storage: makeChatStorage({ createMessage }),
        openai: makeChatOpenAI(create),
      }),
    );

    const result = await request(testServer, "/api/conversations/1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    });

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({ error: "Failed to send message" });
    expect(create).not.toHaveBeenCalled();
  });

  it("streams mocked chat output and saves the assistant response", async () => {
    const createMessage = vi.fn(async (conversationId: number, role: string, content: string) => ({
      id: role === "user" ? 1 : 2,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    }));
    const getMessagesByConversation = vi.fn(async () => []);
    const create = vi.fn(async () =>
      (async function* () {
        yield { choices: [{ delta: { content: "Hello from the Academy." } }] };
      })(),
    );
    const testServer = await startApp(app =>
      registerChatRoutes(app, {
        storage: makeChatStorage({ createMessage, getMessagesByConversation }),
        openai: makeChatOpenAI(create),
      }),
    );

    const result = await request(testServer, "/api/conversations/1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    });

    expect(result.response.status).toBe(200);
    expect(result.response.headers.get("content-type")).toContain("text/event-stream");
    expect(result.text).toContain(JSON.stringify({ content: "Hello from the Academy." }));
    expect(result.text).toContain(JSON.stringify({ done: true }));
    expect(createMessage).toHaveBeenNthCalledWith(2, 1, "assistant", "Hello from the Academy.");
  });

  it("rejects image generation without calling the mocked image model", async () => {
    const generate = vi.fn();
    const testServer = await startApp(app =>
      registerImageRoutes(app, {
        openai: {
          images: { generate },
        } as unknown as Pick<OpenAI, "images">,
      }),
    );

    const result = await request(testServer, "/api/generate-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(result.response.status).toBe(400);
    expect(result.body).toEqual({ error: "Prompt is required" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns a JSON error when image generation fails", async () => {
    const generate = vi.fn(async () => {
      throw new Error("model unavailable");
    });
    const testServer = await startApp(app =>
      registerImageRoutes(app, {
        openai: {
          images: { generate },
        } as unknown as Pick<OpenAI, "images">,
      }),
    );

    const result = await request(testServer, "/api/generate-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "a library" }),
    });

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({ error: "Failed to generate image" });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("rejects an audio message before storage or streaming work", async () => {
    const testServer = await startApp(app => {
      registerAudioRoutes(app);
    });

    const result = await request(testServer, "/api/conversations/1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(result.response.status).toBe(400);
    expect(result.body).toEqual({ error: "Audio data (base64) is required" });
  });

  it("returns JSON when audio preparation or transcription fails before streaming", async () => {
    const createMessage = vi.fn();
    const create = vi.fn();
    const ensureCompatibleFormat = vi.fn(async () => ({
      buffer: Buffer.from("audio"),
      format: "wav" as const,
    }));
    const speechToText = vi.fn(async () => {
      throw new Error("transcription unavailable");
    });
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage }),
        openai: { chat: { completions: { create } } } as unknown as Pick<OpenAI, "chat">,
        ensureCompatibleFormat,
        speechToText,
      });
    });

    const result = await request(testServer, "/api/conversations/1/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audio: Buffer.from("audio").toString("base64") }),
    });

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({ error: "Failed to process voice message" });
    expect(ensureCompatibleFormat).toHaveBeenCalledTimes(1);
    expect(speechToText).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("emits an SSE error and avoids the assistant write when streaming fails", async () => {
    const createMessage = vi.fn(async (conversationId: number, role: string, content: string) => ({
      id: role === "user" ? 1 : 2,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    }));
    const ensureCompatibleFormat = vi.fn(async () => ({
      buffer: Buffer.from("audio"),
      format: "wav" as const,
    }));
    const speechToText = vi.fn(async () => "User transcript");
    const stream = (async function* () {
      yield { choices: [{ delta: { audio: { transcript: "Partial reply" } } }] };
      throw new Error("stream interrupted");
    })();
    const create = vi.fn(async () => stream);
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({
          createMessage,
          getMessagesByConversation: vi.fn(async () => []),
        }),
        openai: { chat: { completions: { create } } } as unknown as Pick<OpenAI, "chat">,
        ensureCompatibleFormat,
        speechToText,
      });
    });

    const result = await request(testServer, "/api/conversations/7/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audio: Buffer.from("audio").toString("base64") }),
    });
    const events = result.text
      .trim()
      .split("\n\n")
      .map(event => JSON.parse(event.replace(/^data: /, "")));

    expect(result.response.status).toBe(200);
    expect(result.response.headers.get("content-type")).toContain("text/event-stream");
    expect(events).toEqual([
      { type: "user_transcript", data: "User transcript" },
      { type: "transcript", data: "Partial reply" },
      { type: "error", error: "Failed to process voice message" },
    ]);
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledWith(7, "user", "User transcript");
    expect(create).toHaveBeenCalledTimes(1);
  });
});