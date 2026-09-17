import express, { type Express, type Request, type Response } from "express";
import type OpenAI from "openai";
import { chatStorage as defaultChatStorage, type ChatStorage } from "../chat/storage";
import {
  openai as defaultOpenai,
  speechToText as defaultSpeechToText,
  ensureCompatibleFormat as defaultEnsureCompatibleFormat,
} from "./client";

// Body parser with 50MB limit for audio payloads
const audioBodyParser = express.json({ limit: "50mb" });
const VOICE_FAILURE_ERROR = "Failed to process voice message";
const VOICE_FAILURE_MARKER = "[Voice response failed. Please retry this message.]";

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export interface AudioRouteDependencies {
  storage?: ChatStorage;
  openai?: Pick<OpenAI, "chat">;
  ensureCompatibleFormat?: typeof defaultEnsureCompatibleFormat;
  speechToText?: typeof defaultSpeechToText;
}

export function registerAudioRoutes(
  app: Express,
  dependencies: AudioRouteDependencies = {},
): void {
  const chatStorage = dependencies.storage ?? defaultChatStorage;
  const openai = dependencies.openai ?? defaultOpenai;
  const ensureCompatibleFormat =
    dependencies.ensureCompatibleFormat ?? defaultEnsureCompatibleFormat;
  const speechToText = dependencies.speechToText ?? defaultSpeechToText;

  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(routeParam(req.params.id), 10);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(routeParam(req.params.id), 10);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send voice message and get streaming audio response
  // Auto-detects audio format and converts WebM/MP4/OGG to WAV
  // Uses gpt-4o-mini-transcribe for STT, gpt-audio for voice response
  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    const conversationId = parseInt(routeParam(req.params.id), 10);
    const disconnectController = new AbortController();
    let clientDisconnected = false;
    let cleanupDisconnectListeners = () => {};
    let userMessageSaved = false;

    const saveVoiceFailureMarker = async () => {
      if (!userMessageSaved || clientDisconnected) return;
      try {
        await chatStorage.createMessage(conversationId, "assistant", VOICE_FAILURE_MARKER);
      } catch (markerError) {
        console.error("Error saving voice failure marker:", markerError);
      }
    };

    try {
      const { audio, voice = "alloy" } = req.body;

      if (!audio) {
        res.status(400).json({ error: "Audio data (base64) is required" });
        return;
      }

      const markClientDisconnected = () => {
        if (res.writableEnded || clientDisconnected) return;
        clientDisconnected = true;
        disconnectController.abort();
      };
      cleanupDisconnectListeners = () => {
        req.off("aborted", markClientDisconnected);
        res.off("close", markClientDisconnected);
        res.off("error", markClientDisconnected);
      };
      req.once("aborted", markClientDisconnected);
      res.once("close", markClientDisconnected);
      res.once("error", markClientDisconnected);

      // 1. Auto-detect format and convert to OpenAI-compatible format
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(
        rawBuffer,
        disconnectController.signal,
      );

      if (clientDisconnected) return;

      // 2. Transcribe user audio
      const userTranscript = await speechToText(
        audioBuffer,
        inputFormat,
        disconnectController.signal,
      );

      if (clientDisconnected) return;

      // 3. Save user message
      await chatStorage.createMessage(conversationId, "user", userTranscript);
      userMessageSaved = true;

      if (clientDisconnected) return;

      // 4. Get conversation history
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // 5. Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // 6. Stream audio response from gpt-audio
      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: chatHistory,
        stream: true,
      }, { signal: disconnectController.signal });

      let assistantTranscript = "";

      for await (const chunk of stream) {
        if (clientDisconnected) break;

        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;

        if (delta?.audio?.transcript) {
          assistantTranscript += delta.audio.transcript;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`);
        }

        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      if (clientDisconnected) return;

      // 7. Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);

      if (clientDisconnected) return;

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
    } catch (error) {
      if (clientDisconnected || res.destroyed || res.writableEnded) return;
      await saveVoiceFailureMarker();
      if (clientDisconnected || res.destroyed || res.writableEnded) return;
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({
          type: "error",
          error: VOICE_FAILURE_ERROR,
          retryable: true,
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: VOICE_FAILURE_ERROR, retryable: true });
      }
    } finally {
      cleanupDisconnectListeners?.();
    }
  });
}
