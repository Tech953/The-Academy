export interface VoiceRetryResponse {
  userTranscript: string;
  assistantTranscript: string;
}

interface VoiceEvent {
  type?: string;
  data?: unknown;
  transcript?: unknown;
  error?: unknown;
}

export async function getVoiceConversationId(
  cachedIds: Map<string, number>,
  localConversationId: string,
  title: string,
): Promise<number> {
  const cachedId = cachedIds.get(localConversationId);
  if (cachedId !== undefined) return cachedId;

  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw await readRequestError(response, "Could not prepare this voice conversation");
  }

  const conversation = await response.json() as { id?: unknown };
  if (
    typeof conversation.id !== "number" ||
    !Number.isSafeInteger(conversation.id) ||
    conversation.id <= 0
  ) {
    throw new Error("The voice conversation could not be initialized. Please try again.");
  }

  cachedIds.set(localConversationId, conversation.id);
  return conversation.id;
}

export async function submitVoiceRetry(
  audio: Blob,
  conversationId: number,
): Promise<VoiceRetryResponse> {
  const base64Audio = await blobToBase64(audio);
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: base64Audio }),
  });
  if (!response.ok) {
    throw await readRequestError(response, "Voice message could not be processed");
  }
  if (!response.body) {
    throw new Error("The voice response stream was unavailable. Please try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let userTranscript = "";
  let assistantTranscript = "";
  let completed = false;

  const consumeEvent = (eventBlock: string) => {
    const data = eventBlock
      .split(/\r?\n/)
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!data) return;

    let event: VoiceEvent;
    try {
      event = JSON.parse(data) as VoiceEvent;
    } catch {
      throw new Error("The voice response could not be read. Please try again.");
    }

    if (event.type === "user_transcript" && typeof event.data === "string") {
      userTranscript = event.data;
    } else if (event.type === "transcript" && typeof event.data === "string") {
      assistantTranscript += event.data;
    } else if (event.type === "done") {
      if (typeof event.transcript === "string") {
        assistantTranscript = event.transcript;
      }
      completed = true;
    } else if (event.type === "error") {
      const message = typeof event.error === "string"
        ? event.error
        : "Voice response failed. Please try again.";
      throw new Error(message);
    }
  };

  const consumeCompleteEvents = () => {
    while (true) {
      const separator = /\r?\n\r?\n/.exec(buffer);
      if (!separator || separator.index === undefined) return;
      const eventBlock = buffer.slice(0, separator.index);
      buffer = buffer.slice(separator.index + separator[0].length);
      consumeEvent(eventBlock);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      consumeCompleteEvents();
    }
    buffer += decoder.decode();
    if (buffer.trim()) consumeEvent(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new Error("The voice response ended before it was complete. Please try again.");
  }
  return { userTranscript, assistantTranscript };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function readRequestError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => null) as { error?: unknown } | null;
  return new Error(typeof payload?.error === "string" ? payload.error : fallback);
}