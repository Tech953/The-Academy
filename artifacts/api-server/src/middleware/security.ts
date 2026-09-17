import rateLimit, {
  ipKeyGenerator,
  type ClientRateLimitInfo,
  type Options,
  type Store,
} from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { isIP } from 'node:net';

export const SPECIALIZED_ROUTE_POLICY = {
  nlpProcess: {
    path: '/nlp/process',
    limiterFamily: 'ai',
    quotaBoundary: 'per-client AI requests',
  },
  aiDescribe: {
    path: '/ai/describe',
    limiterFamily: 'ai',
    quotaBoundary: 'per-client AI requests',
  },
  characterQuestions: {
    path: '/character-creation/generate-questions',
    limiterFamily: 'ai',
    quotaBoundary: 'per-client AI requests',
  },
  npcDialogue: {
    path: '/npc-dialogue',
    limiterFamily: 'ai',
    quotaBoundary: 'per-client AI requests',
  },
  memoryVisualization: {
    path: '/memories/visualize',
    limiterFamily: 'ai',
    quotaBoundary: 'per-client AI requests',
  },
  contentPackRefresh: {
    path: '/content-pack/refresh',
    limiterFamily: 'content-pack',
    quotaBoundary: 'per-client content-pack refreshes',
  },
} as const;

export const SPECIALIZED_LIMITED_PATHS = Object.values(SPECIALIZED_ROUTE_POLICY).map(
  route => route.path,
);

const GENERAL_LIMIT_EXEMPT_PATHS = new Set([
  '/healthz',
  ...SPECIALIZED_LIMITED_PATHS,
]);

export function shouldSkipGeneralApiLimit(req: Pick<Request, 'path'>): boolean {
  return GENERAL_LIMIT_EXEMPT_PATHS.has(req.path);
}

export function normalizeRateLimitIp(ip: string): string {
  const mappedIpv4 = ip.match(/^::ffff:(.+)$/i)?.[1];
  return mappedIpv4 && isIP(mappedIpv4) === 4 ? mappedIpv4 : ip;
}

type RateLimitRequest = Pick<Request, 'ip'> & {
  socket: Pick<Request['socket'], 'remoteAddress'>;
};

export function rateLimitKeyGenerator(req: RateLimitRequest): string {
  const requestIp = normalizeRateLimitIp(req.ip ?? '');
  if (isIP(requestIp) !== 0) return ipKeyGenerator(requestIp);

  const trustedPeerIp = normalizeRateLimitIp(req.socket.remoteAddress ?? '');
  return isIP(trustedPeerIp) !== 0
    ? ipKeyGenerator(trustedPeerIp)
    : 'unknown';
}

export const RATE_LIMIT_STORE_MAX_KEYS = 10_000;

type StoredClient = ClientRateLimitInfo;

/**
 * Local development and single-instance deployments should not require a
 * database just to count requests. Keep the local counter bounded so a large
 * number of forwarded identities cannot retain memory indefinitely.
 */
export class BoundedMemoryStore implements Store {
  private readonly clients = new Map<string, StoredClient>();
  private windowMs = 60_000;
  private interval?: NodeJS.Timeout;

  readonly localKeys = true;

  constructor(private readonly maxKeys = RATE_LIMIT_STORE_MAX_KEYS) {
    if (!Number.isInteger(maxKeys) || maxKeys < 1) {
      throw new Error('BoundedMemoryStore maxKeys must be a positive integer');
    }
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.pruneExpired(), this.windowMs);
    this.interval.unref?.();
  }

  get(key: string): StoredClient | undefined {
    const client = this.clients.get(key);
    if (!client) return undefined;
    if (client.resetTime && client.resetTime.getTime() <= Date.now()) {
      this.clients.delete(key);
      return undefined;
    }
    this.touch(key, client);
    return client;
  }

  increment(key: string): StoredClient {
    const now = Date.now();
    let client = this.clients.get(key);

    if (client?.resetTime && client.resetTime.getTime() <= now) {
      this.clients.delete(key);
      client = undefined;
    }

    if (!client) {
      this.pruneExpired(now);
      while (this.clients.size >= this.maxKeys) {
        const oldestKey = this.clients.keys().next().value as string | undefined;
        if (oldestKey === undefined) break;
        this.clients.delete(oldestKey);
      }
      client = {
        totalHits: 0,
        resetTime: new Date(now + this.windowMs),
      };
      this.clients.set(key, client);
    }

    client.totalHits += 1;
    this.touch(key, client);
    return client;
  }

  decrement(key: string): void {
    const client = this.clients.get(key);
    if (!client) return;
    if (client.totalHits > 0) client.totalHits -= 1;
    this.touch(key, client);
  }

  resetKey(key: string): void {
    this.clients.delete(key);
  }

  resetAll(): void {
    this.clients.clear();
  }

  shutdown(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    this.resetAll();
  }

  private touch(key: string, client: StoredClient): void {
    this.clients.delete(key);
    this.clients.set(key, client);
  }

  private pruneExpired(now = Date.now()): void {
    for (const [key, client] of this.clients) {
      if (client.resetTime && client.resetTime.getTime() <= now) {
        this.clients.delete(key);
      }
    }
  }
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  store: new BoundedMemoryStore(),
  skip: shouldSkipGeneralApiLimit,
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in a few minutes.' },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: new BoundedMemoryStore(),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait before sending more AI requests.' },
});

export const contentPackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: new BoundedMemoryStore(),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Content pack refresh limit reached. Packs refresh automatically each week.' },
});

const MAX_STRING_LENGTH = 20_000;

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[key] = value.trim().slice(0, MAX_STRING_LENGTH);
    } else if (Array.isArray(value)) {
      out[key] = value.map(item =>
        item !== null && typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (value !== null && typeof value === 'object') {
      out[key] = sanitizeObject(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

const SALT_ROUNDS = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function assertOwnership(
  resourceUserId: string | null | undefined,
  requestingUserId: string | null | undefined
): boolean {
  if (!resourceUserId || !requestingUserId) return false;
  return resourceUserId === requestingUserId;
}
