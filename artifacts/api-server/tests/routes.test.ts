import express, { type Express } from "express";
import type OpenAI from "openai";
import { EventEmitter } from "node:events";
import { existsSync, writeFileSync } from "node:fs";
import { request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { spawn } from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerRoutes, RSS_MAX_BODY_BYTES } from "../src/routes/routes";
import type { IStorage } from "../src/storage";
import { registerChatRoutes } from "../src/replit_integrations/chat/routes";
import type { ChatStorage } from "../src/replit_integrations/chat/storage";
import { registerAudioRoutes } from "../src/replit_integrations/audio/routes";
import { registerImageRoutes } from "../src/replit_integrations/image/routes";
import {
  convertToWav,
  openai,
  speechToTextStream,
} from "../src/replit_integrations/audio/client";
import { apiLimiter } from "../src/middleware/security";
import {
  createContentPackContractFixture,
  isUsableContentPack,
} from "@workspace/game-engine";

vi.mock("child_process", async importOriginal => {
  const childProcess = await importOriginal<typeof import("child_process")>();
  return {
    ...childProcess,
    spawn: vi.fn(),
  };
});

type TestServer = {
  server: Server;
  baseUrl: string;
};

const openServers = new Set<Server>();
const requestFetch = globalThis.fetch.bind(globalThis);

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

async function startApp(
  register: (app: Express) => void | Promise<void>,
  options: { generalRateLimit?: boolean } = {},
): Promise<TestServer> {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  if (options.generalRateLimit) app.use("/api", apiLimiter);
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

function expectBlockedRateLimitHeaders(
  response: Response,
  limit: string,
  windowSeconds: number,
) {
  expect(response.status).toBe(429);
  expect(response.headers.get("ratelimit-limit")).toBe(limit);
  expect(response.headers.get("ratelimit-remaining")).toBe("0");
  expect(response.headers.get("ratelimit-policy")).toBe(`${limit};w=${windowSeconds}`);
  expect(response.headers.get("ratelimit-reset")).toMatch(/^\d+$/);
  expect(response.headers.get("retry-after")).toMatch(/^\d+$/);
  expect(response.headers.get("x-ratelimit-limit")).toBeNull();
  expect(response.headers.get("x-ratelimit-remaining")).toBeNull();
  expect(response.headers.get("x-ratelimit-reset")).toBeNull();
}

describe("main API routes", () => {
  it("falls back deterministically when a generated bulletin event is malformed", async () => {
    const upstreamFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", upstreamFetch);
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: "A week of tests.",
            activeEvents: [
              {
                id: "malformed-event",
                title: "Malformed Event",
                description: "",
                npcReaction: "Something is wrong.",
                playerHook: "Investigate.",
                category: "academic",
                durationDays: 3,
                tags: ["test"],
              },
              {
                id: "valid-event-1",
                title: "Valid Event One",
                description: "A valid event.",
                npcReaction: "I noticed.",
                playerHook: "Look closer.",
                category: "academic",
                durationDays: 3,
                tags: ["valid"],
              },
              {
                id: "valid-event-2",
                title: "Valid Event Two",
                description: "Another valid event.",
                npcReaction: "That matters.",
                playerHook: "Take part.",
                category: "social",
                durationDays: 2,
                tags: ["valid"],
              },
            ],
            npcMoodShifts: [
              { npcId: "one", npcName: "One", emotionState: "focused", reason: "work" },
              { npcId: "two", npcName: "Two", emotionState: "happy", reason: "news" },
              { npcId: "three", npcName: "Three", emotionState: "sad", reason: "rain" },
              { npcId: "four", npcName: "Four", emotionState: "calm", reason: "rest" },
            ],
            gedFocusAreas: [
              { subject: "math", topic: "Algebra", whyNow: "Practice" },
              { subject: "science", topic: "Biology", whyNow: "Review" },
            ],
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack");

    expect(result.response.status).toBe(200);
    expect(result.body.generatedBy).toBe("deterministic");
    expect(result.body.activeEvents).toHaveLength(3);
    expect(result.body.activeEvents.every((event: Record<string, unknown>) =>
      typeof event.id === "string" &&
      typeof event.title === "string" &&
      typeof event.description === "string" &&
      typeof event.npcReaction === "string" &&
      typeof event.playerHook === "string" &&
      typeof event.category === "string" &&
      typeof event.durationDays === "number" &&
      Array.isArray(event.tags),
    )).toBe(true);
    expect(result.body.activeEvents.map((event: { id: string }) => event.id))
      .not.toContain("malformed-event");
    expect(create).toHaveBeenCalledTimes(1);
    expect(warningSpy).toHaveBeenCalledWith(
      "[ContentPack] GPT response rejected (activeEvents); using deterministic fallback",
    );
  });

  it("returns a pack accepted by the mobile cache contract", async () => {
    const fixture = createContentPackContractFixture(Date.now());
    let rssIndex = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      const title = fixture.rssHeadlines![rssIndex++];
      const rssXml = `<rss><channel><item><title>${title}</title></item></channel></rss>`;
      return new Response(rssXml, {
        status: 200,
        headers: { "content-type": "application/rss+xml" },
      });
    }));

    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: fixture.themeContext,
            activeEvents: fixture.activeEvents,
            npcMoodShifts: fixture.npcMoodShifts,
            gedFocusAreas: fixture.gedFocusAreas,
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
    });
    const responsePack = await request(testServer, "/api/content-pack");

    expect(result.response.status).toBe(200);
    expect(responsePack.response.status).toBe(200);
    expect(isUsableContentPack(responsePack.body)).toBe(true);
    expect(responsePack.body).toMatchObject({
      activeEvents: fixture.activeEvents,
      npcMoodShifts: fixture.npcMoodShifts,
      gedFocusAreas: fixture.gedFocusAreas,
      generatedBy: "gpt",
      eventsRepaired: false,
    });
    expect(responsePack.body.rssHeadlines).toEqual(fixture.rssHeadlines);
  });

  it.each([
    {
      label: "mood metadata",
      npcMoodShifts: [
        { npcId: "one", npcName: "One", emotionState: "focused", reason: "" },
        { npcId: "two", npcName: "Two", emotionState: "happy", reason: "news" },
        { npcId: "three", npcName: "Three", emotionState: "sad", reason: "rain" },
        { npcId: "four", npcName: "Four", emotionState: "calm", reason: "rest" },
      ],
      gedFocusAreas: [
        { subject: "math", topic: "Algebra", whyNow: "Practice" },
        { subject: "science", topic: "Biology", whyNow: "Review" },
      ],
    },
    {
      label: "GED focus metadata",
      npcMoodShifts: [
        { npcId: "one", npcName: "One", emotionState: "focused", reason: "work" },
        { npcId: "two", npcName: "Two", emotionState: "happy", reason: "news" },
        { npcId: "three", npcName: "Three", emotionState: "sad", reason: "rain" },
        { npcId: "four", npcName: "Four", emotionState: "calm", reason: "rest" },
      ],
      gedFocusAreas: [
        { subject: "not-a-ged-subject", topic: "Algebra", whyNow: "Practice" },
        { subject: "science", topic: "Biology", whyNow: "Review" },
      ],
    },
  ])("falls back when generated $label is malformed", async ({
    npcMoodShifts,
    gedFocusAreas,
  }) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: "A week of tests.",
            activeEvents: [
              {
                id: "valid-event-1",
                title: "Valid Event One",
                description: "A valid event.",
                npcReaction: "I noticed.",
                playerHook: "Look closer.",
                category: "academic",
                durationDays: 3,
                tags: ["valid"],
              },
              {
                id: "valid-event-2",
                title: "Valid Event Two",
                description: "Another valid event.",
                npcReaction: "That matters.",
                playerHook: "Take part.",
                category: "social",
                durationDays: 2,
                tags: ["valid"],
              },
              {
                id: "valid-event-3",
                title: "Valid Event Three",
                description: "A third valid event.",
                npcReaction: "I can help.",
                playerHook: "Join in.",
                category: "discovery",
                durationDays: 1,
                tags: ["valid"],
              },
            ],
            npcMoodShifts,
            gedFocusAreas,
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
    });

    expect(result.response.status).toBe(200);
    expect(result.body.message).toContain("Pack refreshed:");
    const refreshed = await request(testServer, "/api/content-pack");
    expect(refreshed.response.status).toBe(200);
    expect(refreshed.body.generatedBy).toBe("deterministic");
    expect(refreshed.body.npcMoodShifts).toHaveLength(4);
    expect(refreshed.body.gedFocusAreas).toHaveLength(2);
    expect(create).toHaveBeenCalledTimes(1);
  });

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

  it("exposes retry metadata when the AI limiter blocks a client", async () => {
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
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.110",
    };

    for (let requestNumber = 0; requestNumber < 30; requestNumber += 1) {
      const result = await request(testServer, "/api/ai/describe", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "location", locationName: "Library" }),
      });
      expect(result.response.status).toBe(200);
    }

    const blocked = await request(testServer, "/api/ai/describe", {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "location", locationName: "Library" }),
    });
    expectBlockedRateLimitHeaders(blocked.response, "30", 900);
    expect(blocked.body).toEqual({
      error: "AI request limit reached. Please wait before sending more AI requests.",
      quota: "ai",
    });
    expect(create).toHaveBeenCalledTimes(30);
  });

  it("exposes retry metadata when the content-pack limiter blocks a client", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const create = vi.fn(async () => ({ choices: [] }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );
    const headers = {
      "x-forwarded-for": "198.51.100.111",
    };

    for (let requestNumber = 0; requestNumber < 10; requestNumber += 1) {
      const result = await request(testServer, "/api/content-pack/refresh", {
        method: "POST",
        headers,
      });
      expect(result.response.status).toBe(200);
    }

    const blocked = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
      headers,
    });
    expectBlockedRateLimitHeaders(blocked.response, "10", 3600);
    expect(blocked.body).toEqual({
      error: "Content pack refresh limit reached. Packs refresh automatically each week.",
      quota: "content-pack",
    });
    expect(create).toHaveBeenCalledTimes(10);
  });

  it("keeps AI and content-refresh quotas isolated from each other and the general quota", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const create = vi.fn(async () => ({
      choices: [{ message: { content: "A deterministic test response." } }],
    }));
    const testServer = await startApp(
      app =>
        registerRoutes(app, {
          storage: makeStorage(),
          openai: makeChatOpenAI(create),
          skipContentRefresh: true,
        }),
      { generalRateLimit: true },
    );
    const aiClient = "198.51.100.120";
    const refreshClient = "198.51.100.121";
    const aiRequest = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": aiClient,
      },
      body: JSON.stringify({ type: "location", locationName: "Library" }),
    };

    for (let requestNumber = 0; requestNumber < 30; requestNumber += 1) {
      expect((await request(testServer, "/api/ai/describe", aiRequest)).response.status).toBe(200);
    }
    const blockedAi = await request(testServer, "/api/ai/describe", aiRequest);
    expectBlockedRateLimitHeaders(blockedAi.response, "30", 900);

    // AI traffic does not consume the general or content-refresh buckets.
    expect(
      (await request(testServer, "/api/locations", {
        headers: { "x-forwarded-for": aiClient },
      })).response.status,
    ).toBe(200);
    expect(
      (await request(testServer, "/api/content-pack/refresh", {
        method: "POST",
        headers: { "x-forwarded-for": aiClient },
      })).response.status,
    ).toBe(200);

    for (let requestNumber = 0; requestNumber < 10; requestNumber += 1) {
      expect(
        (await request(testServer, "/api/content-pack/refresh", {
          method: "POST",
          headers: { "x-forwarded-for": refreshClient },
        })).response.status,
      ).toBe(200);
    }
    const blockedRefresh = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
      headers: { "x-forwarded-for": refreshClient },
    });
    expectBlockedRateLimitHeaders(blockedRefresh.response, "10", 3600);

    // Content refresh traffic does not consume the AI or general buckets.
    expect((await request(testServer, "/api/locations", {
      headers: { "x-forwarded-for": refreshClient },
    })).response.status).toBe(200);
    expect(
      (await request(testServer, "/api/ai/describe", {
        ...aiRequest,
        headers: { ...aiRequest.headers, "x-forwarded-for": refreshClient },
      })).response.status,
    ).toBe(200);
  });

  it("keeps concurrent AI, refresh, and general bursts in separate client buckets", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const create = vi.fn(async () => ({
      choices: [{ message: { content: "A deterministic concurrent response." } }],
    }));
    const testServer = await startApp(
      app =>
        registerRoutes(app, {
          storage: makeStorage(),
          openai: makeChatOpenAI(create),
          skipContentRefresh: true,
        }),
      { generalRateLimit: true },
    );
    const client = "198.51.100.130";
    const aiRequest = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": client,
      },
      body: JSON.stringify({ type: "location", locationName: "Library" }),
    };
    const refreshRequest = {
      method: "POST",
      headers: { "x-forwarded-for": client },
    };
    const generalRequest = {
      headers: { "x-forwarded-for": client },
    };

    const [aiBurst, refreshBurst, generalBurst] = await Promise.all([
      Promise.all(
        Array.from({ length: 30 }, () =>
          request(testServer, "/api/ai/describe", aiRequest),
        ),
      ),
      Promise.all(
        Array.from({ length: 10 }, () =>
          request(testServer, "/api/content-pack/refresh", refreshRequest),
        ),
      ),
      Promise.all(
        Array.from({ length: 200 }, () =>
          request(testServer, "/api/locations", generalRequest),
        ),
      ),
    ]);

    expect(aiBurst.every(({ response }) => response.status === 200)).toBe(true);
    expect(refreshBurst.every(({ response }) => response.status === 200)).toBe(true);
    expect(generalBurst.every(({ response }) => response.status === 200)).toBe(true);

    const [blockedAi, blockedRefresh, blockedGeneral] = await Promise.all([
      request(testServer, "/api/ai/describe", aiRequest),
      request(testServer, "/api/content-pack/refresh", refreshRequest),
      request(testServer, "/api/locations", generalRequest),
    ]);

    expectBlockedRateLimitHeaders(blockedAi.response, "30", 900);
    expectBlockedRateLimitHeaders(blockedRefresh.response, "10", 3600);
    expectBlockedRateLimitHeaders(blockedGeneral.response, "200", 900);
    expect(blockedGeneral.body).toEqual({
      error: "Too many requests — please try again in a few minutes.",
      quota: "general",
    });
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

  it.each([
    { label: "an aborted fetch", name: "AbortError", message: "The operation was aborted" },
    { label: "a timeout fetch", name: "TimeoutError", message: "The operation timed out" },
  ])("returns a retryable 504 for $label", async ({ name, message }) => {
    const fetchError = Object.assign(new Error(message), { name });
    const upstreamFetch = vi.fn(async () => {
      throw fetchError;
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Farticle",
    );

    expect(result.response.status).toBe(504);
    expect(result.body).toEqual({
      error: "URL metadata fetch timed out",
      retryable: true,
    });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("aborts upstream metadata fetching when the client disconnects", async () => {
    let requestSignal: AbortSignal | undefined;
    let resolveUpstreamStarted!: () => void;
    const upstreamStarted = new Promise<void>(resolve => {
      resolveUpstreamStarted = resolve;
    });
    const upstreamFetch = vi.fn((_input: string, init?: RequestInit) => {
      requestSignal = init?.signal as AbortSignal | undefined;
      resolveUpstreamStarted();
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("The operation was aborted"), {
            name: "AbortError",
          }));
        }, { once: true });
      });
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );
    const clientRequest = httpRequest(
      `${testServer.baseUrl}/api/fetch-url-meta?url=https%3A%2F%2Fexample.com%2Farticle`,
    );
    clientRequest.on("error", () => {});
    clientRequest.end();

    await upstreamStarted;
    expect(requestSignal?.aborted).toBe(false);
    clientRequest.destroy();
    await new Promise<void>(resolve => {
      if (requestSignal?.aborted) {
        resolve();
      } else {
        requestSignal?.addEventListener("abort", () => resolve(), { once: true });
      }
    });

    expect(requestSignal?.aborted).toBe(true);
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

  it("rejects an oversized RSS response before parsing it", async () => {
    const upstreamFetch = vi.fn(async () => new Response("ignored", {
      status: 200,
      headers: { "content-length": String(RSS_MAX_BODY_BYTES + 1) },
    }));
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      "/api/rss?url=https%3A%2F%2Fnasa.gov%2Ffeed.xml",
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "RSS response too large" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects an oversized chunked RSS response while reading it", async () => {
    const upstreamFetch = vi.fn(async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode("x".repeat(RSS_MAX_BODY_BYTES + 1)),
          );
          controller.close();
        },
      });
      return new Response(body, { status: 200 });
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
    expect(result.body).toEqual({ error: "RSS response too large" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("skips oversized scheduled RSS feeds before content-pack parsing", async () => {
    const fixture = createContentPackContractFixture(Date.now());
    const oversizedResponse = new Response("ignored", {
      status: 200,
      headers: { "content-length": String(RSS_MAX_BODY_BYTES + 1) },
    });
    const upstreamFetch = vi.fn()
      .mockResolvedValueOnce(oversizedResponse)
      .mockResolvedValue(new Response("", { status: 503 }));
    vi.stubGlobal("fetch", upstreamFetch);

    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: fixture.themeContext,
            activeEvents: fixture.activeEvents,
            npcMoodShifts: fixture.npcMoodShifts,
            gedFocusAreas: fixture.gedFocusAreas,
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
    });

    expect(result.response.status).toBe(200);
    expect(result.body.generatedBy).toBe("gpt");
    expect(result.body.rssHeadlines).toBeUndefined();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0].messages[0].content).not.toContain(
      "Real-world inspiration headlines",
    );
    expect(upstreamFetch).toHaveBeenCalledTimes(3);
  });

  it("does not follow a scheduled RSS redirect to HTTP", async () => {
    const fixture = createContentPackContractFixture(Date.now());
    const insecureTarget = "http://www.nasa.gov/insecure-feed.xml";
    const upstreamFetch = vi.fn(async (url: string) => {
      if (url === "https://www.nasa.gov/rss/dyn/breaking_news.rss") {
        return new Response(null, {
          status: 302,
          headers: { location: insecureTarget },
        });
      }
      return new Response("", { status: 503 });
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: fixture.themeContext,
            activeEvents: fixture.activeEvents,
            npcMoodShifts: fixture.npcMoodShifts,
            gedFocusAreas: fixture.gedFocusAreas,
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
    });

    expect(result.response.status).toBe(200);
    expect(upstreamFetch.mock.calls.map(([url]) => url)).toEqual([
      "https://www.nasa.gov/rss/dyn/breaking_news.rss",
      "https://www.sciencedaily.com/rss/all.xml",
      "https://phys.org/rss-feed/",
    ]);
    expect(upstreamFetch.mock.calls.every(([, init]) => init?.redirect === "manual")).toBe(true);
    expect(upstreamFetch.mock.calls.some(([url]) => url === insecureTarget)).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0].messages[0].content).not.toContain(
      "Real-world inspiration headlines",
    );
  });

  it("uses headlines from a trusted HTTPS redirect in scheduled imports", async () => {
    const fixture = createContentPackContractFixture(Date.now());
    const firstFeedUrl = "https://www.nasa.gov/rss/dyn/breaking_news.rss";
    const trustedTarget = "https://nasa.gov/rss/dyn/breaking_news.rss";
    const headline = "Verified headline from trusted redirected feed";
    const upstreamFetch = vi.fn(async (url: string) => {
      if (url === firstFeedUrl) {
        return new Response(null, {
          status: 302,
          headers: { location: trustedTarget },
        });
      }
      if (url === trustedTarget) {
        return new Response(
          `<rss><channel><item><title>${headline}</title></item></channel></rss>`,
          { status: 200, headers: { "content-type": "application/rss+xml" } },
        );
      }
      return new Response("", { status: 503 });
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const create = vi.fn(async () => ({
      choices: [{
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            themeContext: fixture.themeContext,
            activeEvents: fixture.activeEvents,
            npcMoodShifts: fixture.npcMoodShifts,
            gedFocusAreas: fixture.gedFocusAreas,
          }),
        },
      }],
    }));
    const testServer = await startApp(app =>
      registerRoutes(app, {
        storage: makeStorage(),
        openai: makeChatOpenAI(create),
        skipContentRefresh: true,
      }),
    );

    const result = await request(testServer, "/api/content-pack/refresh", {
      method: "POST",
    });

    expect(result.response.status).toBe(200);
    expect(upstreamFetch.mock.calls.map(([url]) => url)).toEqual([
      firstFeedUrl,
      trustedTarget,
      "https://www.sciencedaily.com/rss/all.xml",
      "https://phys.org/rss-feed/",
    ]);
    expect(upstreamFetch.mock.calls.every(([, init]) => init?.redirect === "manual")).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0].messages[0].content).toContain(headline);

    const pack = await request(testServer, "/api/content-pack");
    expect(pack.response.status).toBe(200);
    expect(pack.body.rssHeadlines).toContain(headline);
  });

  it("allows trusted subdomains but rejects lookalike hosts before fetching", async () => {
    const upstreamFetch = vi.fn(async () => new Response("temporarily unavailable", { status: 503 }));
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    for (const trustedUrl of [
      "https://www.nasa.gov/feed.xml",
      "https://feeds.sciencedaily.com/all.xml",
    ]) {
      const result = await request(testServer, `/api/rss?url=${encodeURIComponent(trustedUrl)}`);
      expect(result.response.status).toBe(502);
      expect(result.body).toEqual({ error: "upstream 503" });
    }

    for (const lookalikeUrl of [
      "https://evilnasa.gov/feed.xml",
      "https://nasa.gov.evil.example/feed.xml",
      "https://not-sciencedaily.com/all.xml",
    ]) {
      const result = await request(testServer, `/api/rss?url=${encodeURIComponent(lookalikeUrl)}`);
      expect(result.response.status).toBe(403);
      expect(result.body).toEqual({ error: "feed domain not allowed" });
    }

    expect(upstreamFetch).toHaveBeenCalledTimes(2);
  });

  it("rejects HTTP RSS feeds before fetching", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      `/api/rss?url=${encodeURIComponent("http://www.nasa.gov/feed.xml")}`,
    );

    expect(result.response.status).toBe(403);
    expect(result.body).toEqual({ error: "feed must use https" });
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("validates each trusted RSS redirect before following it", async () => {
    const initialUrl = "https://nasa.gov/feed.xml";
    const redirectedUrl = "https://www.nasa.gov/feed.xml";
    const xml = `
      <rss><channel><item>
        <title>Trusted redirect headline</title>
        <link>https://www.nasa.gov/story</link>
      </item></channel></rss>
    `;
    const upstreamFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe("manual");
      if (url === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { location: redirectedUrl },
        });
      }
      expect(url).toBe(redirectedUrl);
      return new Response(xml, { status: 200 });
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      `/api/rss?url=${encodeURIComponent(initialUrl)}`,
    );

    expect(result.response.status).toBe(200);
    expect(result.body.items).toEqual([
      {
        title: "Trusted redirect headline",
        link: "https://www.nasa.gov/story",
      },
    ]);
    expect(upstreamFetch).toHaveBeenCalledTimes(2);
  });

  it("stops a trusted RSS redirect loop at the hop limit", async () => {
    const initialUrl = "https://nasa.gov/feed.xml";
    const alternateUrl = "https://www.nasa.gov/feed.xml";
    const upstreamFetch = vi.fn(async (url: string) => {
      return new Response(null, {
        status: 302,
        headers: {
          location: url === initialUrl ? alternateUrl : initialUrl,
        },
      });
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      `/api/rss?url=${encodeURIComponent(initialUrl)}`,
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "too many RSS redirects" });
    expect(upstreamFetch).toHaveBeenCalledTimes(4);
  });

  it("rejects an RSS redirect without Location before following it", async () => {
    const initialUrl = "https://nasa.gov/feed.xml";
    const upstreamFetch = vi.fn(async () =>
      new Response(null, { status: 302 }),
    );
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      `/api/rss?url=${encodeURIComponent(initialUrl)}`,
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "RSS redirect missing location" });
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects an untrusted RSS redirect without fetching its final target", async () => {
    const initialUrl = "https://nasa.gov/feed.xml";
    const upstreamFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe("manual");
      if (url === initialUrl) {
        return new Response(null, {
          status: 302,
          headers: { location: "http://www.nasa.gov/feed.xml" },
        });
      }
      throw new Error("final target must not be fetched");
    });
    vi.stubGlobal("fetch", upstreamFetch);
    const testServer = await startApp(app =>
      registerRoutes(app, { storage: makeStorage(), skipContentRefresh: true }),
    );

    const result = await request(
      testServer,
      `/api/rss?url=${encodeURIComponent(initialUrl)}`,
    );

    expect(result.response.status).toBe(502);
    expect(result.body).toEqual({ error: "feed redirect domain not allowed" });
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
    expect(result.body).toEqual({
      error: "Failed to process voice message",
      retryable: true,
    });
    expect(ensureCompatibleFormat).toHaveBeenCalledTimes(1);
    expect(speechToText).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("keeps a failed pre-header voice session explicit after saving the user transcript", async () => {
    const createMessage = vi.fn(async (conversationId: number, role: string, content: string) => ({
      id: role === "user" ? 1 : 2,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    }));
    const getMessagesByConversation = vi.fn(async () => {
      throw new Error("history unavailable");
    });
    const ensureCompatibleFormat = vi.fn(async () => ({
      buffer: Buffer.from("audio"),
      format: "wav" as const,
    }));
    const speechToText = vi.fn(async () => "User transcript");
    const create = vi.fn();
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage, getMessagesByConversation }),
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

    expect(result.response.status).toBe(500);
    expect(result.body).toEqual({
      error: "Failed to process voice message",
      retryable: true,
    });
    expect(createMessage).toHaveBeenNthCalledWith(1, 7, "user", "User transcript");
    expect(createMessage).toHaveBeenNthCalledWith(
      2,
      7,
      "assistant",
      "[Voice response failed. Please retry this message.]",
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("forwards every voice reply chunk before completing without aborting the provider", async () => {
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
    let providerSignal: AbortSignal | undefined;
    const providerSignalActiveDuringStream: boolean[] = [];
    const create = vi.fn(async (
      _params: Record<string, unknown>,
      options: { signal?: AbortSignal },
    ) => {
      providerSignal = options.signal;
      return (async function* () {
        for (const audio of [
          { transcript: "Normal " },
          { data: "encoded-audio-1" },
          { transcript: "reply" },
          { data: "encoded-audio-2" },
        ]) {
          providerSignalActiveDuringStream.push(providerSignal?.aborted === false);
          yield {
            choices: [{
              delta: {
                audio,
              },
            }],
          };
        }
        providerSignalActiveDuringStream.push(providerSignal?.aborted === false);
      })();
    });
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

    await new Promise<void>(resolve => setImmediate(resolve));

    expect(result.response.status).toBe(200);
    expect(events).toEqual([
      { type: "user_transcript", data: "User transcript" },
      { type: "transcript", data: "Normal " },
      { type: "audio", data: "encoded-audio-1" },
      { type: "transcript", data: "reply" },
      { type: "audio", data: "encoded-audio-2" },
      { type: "done", transcript: "Normal reply" },
    ]);
    expect(providerSignal).toBeDefined();
    expect(providerSignal?.aborted).toBe(false);
    expect(providerSignalActiveDuringStream).toEqual([true, true, true, true, true]);
    expect(createMessage).toHaveBeenNthCalledWith(1, 7, "user", "User transcript");
    expect(createMessage).toHaveBeenNthCalledWith(2, 7, "assistant", "Normal reply");
  });

  it("excludes the stored voice failure marker from the next provider prompt", async () => {
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
    const speechToText = vi.fn(async () => "Retry transcript");
    const getMessagesByConversation = vi.fn(async () => [
      {
        id: 1,
        conversationId: 7,
        role: "user",
        content: "Earlier question",
        createdAt: new Date(),
      },
      {
        id: 2,
        conversationId: 7,
        role: "assistant",
        content: "Earlier answer",
        createdAt: new Date(),
      },
      {
        id: 3,
        conversationId: 7,
        role: "assistant",
        content: "[Voice response failed. Please retry this message.]",
        createdAt: new Date(),
      },
    ]);
    let providerParams: Record<string, unknown> | undefined;
    const create = vi.fn(async (params: Record<string, unknown>) => {
      providerParams = params;
      return (async function* () {
        yield { choices: [{ delta: { audio: { transcript: "Retry reply" } } }] };
      })();
    });
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage, getMessagesByConversation }),
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

    expect(result.response.status).toBe(200);
    expect(providerParams?.messages).toEqual([
      { role: "user", content: "Earlier question" },
      { role: "assistant", content: "Earlier answer" },
    ]);
    expect(providerParams?.messages).not.toContainEqual({
      role: "assistant",
      content: "[Voice response failed. Please retry this message.]",
    });
    expect(getMessagesByConversation).toHaveBeenCalledWith(7);
  });

  it("aborts format conversion and skips transcription when the client disconnects early", async () => {
    const createMessage = vi.fn();
    const create = vi.fn();
    let conversionSignal: AbortSignal | undefined;
    let resolveConversionStarted: (() => void) | undefined;
    const conversionStarted = new Promise<void>(resolve => {
      resolveConversionStarted = resolve;
    });
    const ensureCompatibleFormat = vi.fn(async (
      _audio: Buffer,
      signal?: AbortSignal,
    ) => {
      conversionSignal = signal;
      resolveConversionStarted?.();
      await new Promise<never>((_resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error("conversion aborted"));
          return;
        }
        signal?.addEventListener("abort", () => reject(new Error("conversion aborted")), {
          once: true,
        });
      });
    });
    const speechToText = vi.fn();
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage }),
        openai: { chat: { completions: { create } } } as unknown as Pick<OpenAI, "chat">,
        ensureCompatibleFormat,
        speechToText,
      });
    });

    const clientClosed = new Promise<void>((resolve, reject) => {
      const client = httpRequest(
        `${testServer.baseUrl}/api/conversations/7/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => response.once("close", resolve),
      );
      client.once("error", error => {
        if ((error as NodeJS.ErrnoException).code === "ECONNRESET") resolve();
        else reject(error);
      });
      client.end(JSON.stringify({ audio: Buffer.from("audio").toString("base64") }));
      void conversionStarted.then(() => client.destroy());
    });

    await clientClosed;
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    expect(conversionSignal?.aborted).toBe(true);
    expect(speechToText).not.toHaveBeenCalled();
    expect(createMessage).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("aborts transcription and skips storage when the client disconnects before streaming", async () => {
    const createMessage = vi.fn();
    const create = vi.fn();
    let transcriptionSignal: AbortSignal | undefined;
    let resolveTranscriptionStarted: (() => void) | undefined;
    const transcriptionStarted = new Promise<void>(resolve => {
      resolveTranscriptionStarted = resolve;
    });
    const ensureCompatibleFormat = vi.fn(async () => ({
      buffer: Buffer.from("audio"),
      format: "wav" as const,
    }));
    const speechToText = vi.fn(async (
      _audio: Buffer,
      _format: "wav" | "mp3" | "webm",
      signal?: AbortSignal,
    ) => {
      transcriptionSignal = signal;
      resolveTranscriptionStarted?.();
      await new Promise<never>((_resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error("transcription aborted"));
          return;
        }
        signal?.addEventListener("abort", () => reject(new Error("transcription aborted")), {
          once: true,
        });
      });
    });
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage }),
        openai: { chat: { completions: { create } } } as unknown as Pick<OpenAI, "chat">,
        ensureCompatibleFormat,
        speechToText,
      });
    });

    const clientClosed = new Promise<void>((resolve, reject) => {
      const client = httpRequest(
        `${testServer.baseUrl}/api/conversations/7/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => response.once("close", resolve),
      );
      client.once("error", error => {
        if ((error as NodeJS.ErrnoException).code === "ECONNRESET") resolve();
        else reject(error);
      });
      client.end(JSON.stringify({ audio: Buffer.from("audio").toString("base64") }));
      void transcriptionStarted.then(() => client.destroy());
    });

    await clientClosed;
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    expect(transcriptionSignal?.aborted).toBe(true);
    expect(createMessage).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not start voice streaming if the client disconnects while saving the transcript", async () => {
    const createMessage = vi.fn(async (
      conversationId: number,
      role: string,
      content: string,
    ) => {
      if (role === "user") {
        resolveUserSaveStarted?.();
        await userSaveGate;
      }
      return {
        id: role === "user" ? 1 : 2,
        conversationId,
        role,
        content,
        createdAt: new Date(),
      };
    });
    let resolveUserSaveStarted!: () => void;
    const userSaveStarted = new Promise<void>(resolve => {
      resolveUserSaveStarted = resolve;
    });
    let finishUserSave!: () => void;
    const userSaveGate = new Promise<void>(resolve => {
      finishUserSave = resolve;
    });
    const getMessagesByConversation = vi.fn(async () => []);
    const ensureCompatibleFormat = vi.fn(async () => ({
      buffer: Buffer.from("audio"),
      format: "wav" as const,
    }));
    const speechToText = vi.fn(async () => "User transcript");
    const create = vi.fn();
    const testServer = await startApp(app => {
      registerAudioRoutes(app, {
        storage: makeChatStorage({ createMessage, getMessagesByConversation }),
        openai: { chat: { completions: { create } } } as unknown as Pick<OpenAI, "chat">,
        ensureCompatibleFormat,
        speechToText,
      });
    });

    const clientClosed = new Promise<void>((resolve, reject) => {
      const client = httpRequest(
        `${testServer.baseUrl}/api/conversations/7/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => response.once("close", resolve),
      );
      client.once("error", error => {
        if ((error as NodeJS.ErrnoException).code === "ECONNRESET") resolve();
        else reject(error);
      });
      client.end(JSON.stringify({ audio: Buffer.from("audio").toString("base64") }));
      void userSaveStarted.then(() => client.destroy());
    });

    await clientClosed;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    finishUserSave();
    await new Promise<void>(resolve => setImmediate(resolve));

    expect(speechToText).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledWith(7, "user", "User transcript");
    expect(getMessagesByConversation).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
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
      { type: "error", error: "Failed to process voice message", retryable: true },
    ]);
    expect(createMessage).toHaveBeenCalledTimes(2);
    expect(createMessage).toHaveBeenCalledWith(7, "user", "User transcript");
    expect(createMessage).toHaveBeenCalledWith(
      7,
      "assistant",
      "[Voice response failed. Please retry this message.]",
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("aborts provider streaming and skips the assistant write when the client disconnects", async () => {
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
    let providerSignal: AbortSignal | undefined;
    let resolveProviderStart: ((signal: AbortSignal) => void) | undefined;
    const providerStarted = new Promise<AbortSignal>(resolve => {
      resolveProviderStart = resolve;
    });
    const create = vi.fn(async (
      _params: Record<string, unknown>,
      options: { signal?: AbortSignal },
    ) => {
      providerSignal = options.signal;
      resolveProviderStart?.(providerSignal);
      return (async function* () {
        yield { choices: [{ delta: { audio: { transcript: "Partial reply" } } }] };
        await new Promise<void>(resolve => {
          if (providerSignal?.aborted) {
            resolve();
            return;
          }
          providerSignal?.addEventListener("abort", () => resolve(), { once: true });
        });
      })();
    });
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

    const clientDisconnected = new Promise<void>((resolve, reject) => {
      const client = httpRequest(
        `${testServer.baseUrl}/api/conversations/7/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
        response => {
          response.once("data", async () => {
            try {
              await providerStarted;
              client.destroy();
            } catch (error) {
              reject(error);
            }
          });
          response.once("close", resolve);
        },
      );
      client.once("error", error => {
        if ((error as NodeJS.ErrnoException).code === "ECONNRESET") {
          resolve();
        } else {
          reject(error);
        }
      });
      client.end(JSON.stringify({ audio: Buffer.from("audio").toString("base64") }));
    });

    await clientDisconnected;
    const signal = await providerStarted;
    await new Promise<void>(resolve => {
      if (signal.aborted) {
        resolve();
      } else {
        signal.addEventListener("abort", () => resolve(), { once: true });
      }
    });

    expect(signal.aborted).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(createMessage).toHaveBeenCalledWith(7, "user", "User transcript");
  });
});

describe("audio conversion temporary files", () => {
  it("kills ffmpeg and removes both files when conversion is aborted", async () => {
    const spawnMock = vi.mocked(spawn);
    spawnMock.mockReset();

    const child = new EventEmitter() as EventEmitter & {
      stderr: EventEmitter;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stderr = new EventEmitter();
    child.kill = vi.fn(() => true);

    let resolveConversionStarted!: () => void;
    const conversionStarted = new Promise<void>(resolve => {
      resolveConversionStarted = resolve;
    });
    let inputPath: string | undefined;
    let outputPath: string | undefined;
    spawnMock.mockImplementation((_command, args) => {
      const ffmpegArgs = args as readonly string[];
      inputPath = ffmpegArgs[1];
      outputPath = ffmpegArgs.at(-1);
      if (!inputPath || !outputPath) {
        throw new Error("ffmpeg paths were not provided");
      }
      writeFileSync(outputPath, "partial WAV output");
      resolveConversionStarted();
      return child as unknown as ReturnType<typeof spawn>;
    });

    const controller = new AbortController();
    const conversion = convertToWav(Buffer.from("input audio"), controller.signal);
    await conversionStarted;

    const inputExistedBeforeAbort = existsSync(inputPath!);
    const outputExistedBeforeAbort = existsSync(outputPath!);
    controller.abort();

    await expect(conversion).rejects.toMatchObject({ name: "AbortError" });
    expect(inputExistedBeforeAbort).toBe(true);
    expect(outputExistedBeforeAbort).toBe(true);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
    expect(existsSync(inputPath!)).toBe(false);
    expect(existsSync(outputPath!)).toBe(false);
  });
});

describe("streaming speech-to-text client", () => {
  it("preserves normal streamed transcript deltas", async () => {
    const create = vi.spyOn(openai.audio.transcriptions, "create");
    const providerStream = (async function* () {
      yield { type: "transcript.text.delta", delta: "First " };
      yield { type: "transcript.text.delta", delta: "reply" };
      yield { type: "transcript.text.done", text: "First reply" };
    })();
    create.mockResolvedValue(providerStream as never);

    const transcriptStream = await speechToTextStream(Buffer.from("audio"), "webm");
    const transcriptChunks: string[] = [];
    for await (const chunk of transcriptStream) transcriptChunks.push(chunk);

    expect(transcriptChunks).toEqual(["First ", "reply"]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini-transcribe",
        stream: true,
      }),
      { signal: undefined },
    );
  });

  it("forwards abort and ends cleanly when the listener leaves", async () => {
    const controller = new AbortController();
    const create = vi.spyOn(openai.audio.transcriptions, "create");
    const providerStream = (async function* () {
      yield { type: "transcript.text.delta", delta: "Partial transcript" };
      await new Promise<never>((_resolve, reject) => {
        const abort = () => {
          const error = new Error("The operation was aborted");
          error.name = "AbortError";
          reject(error);
        };
        if (controller.signal.aborted) {
          abort();
          return;
        }
        controller.signal.addEventListener("abort", abort, { once: true });
      });
    })();
    create.mockResolvedValue(providerStream as never);

    const transcriptStream = await speechToTextStream(
      Buffer.from("audio"),
      "webm",
      controller.signal,
    );
    const iterator = transcriptStream[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: "Partial transcript",
    });
    controller.abort();
    await expect(iterator.next()).resolves.toMatchObject({ done: true });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini-transcribe",
        stream: true,
      }),
      { signal: controller.signal },
    );
  });
});