import rateLimit, {
  ipKeyGenerator,
  type ClientRateLimitInfo,
  type Options,
  type Store,
} from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { isIP } from 'node:net';
import { logger } from '../lib/logger';

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

export type SpecializedRoutePolicyKey = keyof typeof SPECIALIZED_ROUTE_POLICY;
export type SpecializedRouteReference = {
  key: SpecializedRoutePolicyKey;
  method: 'POST';
  path: string;
  limiterFamily: (typeof SPECIALIZED_ROUTE_POLICY)[SpecializedRoutePolicyKey]['limiterFamily'];
  quotaBoundary: string;
};

/**
 * Build route references for API documentation and other generated consumers.
 * Keep specialized paths and quota metadata sourced from the policy above.
 */
export function getSpecializedRouteReferences(): SpecializedRouteReference[] {
  return (Object.keys(SPECIALIZED_ROUTE_POLICY) as SpecializedRoutePolicyKey[]).map(key => {
    const policy = SPECIALIZED_ROUTE_POLICY[key];
    return {
      key,
      method: 'POST',
      path: `/api${policy.path}`,
      limiterFamily: policy.limiterFamily,
      quotaBoundary: policy.quotaBoundary,
    };
  });
}

export const SPECIALIZED_ROUTE_REFERENCES = getSpecializedRouteReferences();

export function validateSpecializedRouteReferences(
  references: readonly SpecializedRouteReference[],
): void {
  const expected = getSpecializedRouteReferences();
  const expectedByKey = new Map(expected.map(reference => [reference.key, reference]));
  const actualByKey = new Map(references.map(reference => [reference.key, reference]));
  const issues: string[] = [];

  if (actualByKey.size !== references.length) {
    issues.push('duplicate route reference key');
  }

  for (const reference of references) {
    if (!expectedByKey.has(reference.key)) {
      issues.push(`unexpected route reference ${reference.key}`);
    }
  }

  for (const expectedReference of expected) {
    const actualReference = actualByKey.get(expectedReference.key);
    if (!actualReference) {
      issues.push(`missing route reference ${expectedReference.key}`);
      continue;
    }
    if (actualReference.path !== expectedReference.path) {
      issues.push(
        `path mismatch for ${expectedReference.key}: expected ${expectedReference.path}, got ${actualReference.path}`,
      );
    }
    if (actualReference.method !== expectedReference.method) {
      issues.push(`method mismatch for ${expectedReference.key}`);
    }
    if (actualReference.limiterFamily !== expectedReference.limiterFamily) {
      issues.push(`limiter family mismatch for ${expectedReference.key}`);
    }
    if (actualReference.quotaBoundary !== expectedReference.quotaBoundary) {
      issues.push(`quota boundary mismatch for ${expectedReference.key}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Specialized route references are out of sync: ${issues.join('; ')}`);
  }
}

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
export const RATE_LIMIT_CAPACITY_LOG_COOLDOWN_MS = 60_000;
export const RATE_LIMIT_QUOTA_CATEGORIES = {
  general: 'general',
  ai: 'ai',
  contentPack: 'content-pack',
} as const;
const RATE_LIMIT_TABLE = 'academy_rate_limit_clients';

type StoredClient = ClientRateLimitInfo;
export interface BoundedMemoryStoreStats {
  activeKeys: number;
  maxKeys: number;
  capacityPressureEvents: number;
  evictionCount: number;
}
export interface RateLimitCapacitySnapshot {
  activeStores: number;
  totalCapacityPressureEvents: number;
  totalEvictions: number;
  stores: Array<BoundedMemoryStoreStats & { store: string }>;
}
type RateLimitEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'DATABASE_URL'>
>;
export type RateLimitStorePool = {
  query<T extends Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
};
const boundedMemoryStores = new Set<BoundedMemoryStore>();

export function shouldUseSharedRateLimitStore(
  environment: RateLimitEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === 'production' && Boolean(environment.DATABASE_URL);
}

function isProductionEnvironment(
  environment: RateLimitEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === 'production';
}

/**
 * Local development and single-instance deployments should not require a
 * database just to count requests. Keep the local counter bounded so a large
 * number of forwarded identities cannot retain memory indefinitely.
 */
export class BoundedMemoryStore implements Store {
  private readonly clients = new Map<string, StoredClient>();
  private windowMs = 60_000;
  private interval?: NodeJS.Timeout;
  private capacityPressureEvents = 0;
  private evictionCount = 0;
  private lastCapacityLogAt: number | null = null;

  readonly localKeys = true;

  constructor(
    private readonly maxKeys = RATE_LIMIT_STORE_MAX_KEYS,
    readonly storeName = 'bounded-memory-rate-limit',
  ) {
    if (!Number.isInteger(maxKeys) || maxKeys < 1) {
      throw new Error('BoundedMemoryStore maxKeys must be a positive integer');
    }
    boundedMemoryStores.add(this);
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.pruneExpired(), this.windowMs);
    this.interval.unref?.();
  }

  getStats(): BoundedMemoryStoreStats {
    return {
      activeKeys: this.clients.size,
      maxKeys: this.maxKeys,
      capacityPressureEvents: this.capacityPressureEvents,
      evictionCount: this.evictionCount,
    };
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
      let evictions = 0;
      while (this.clients.size >= this.maxKeys) {
        const oldestKey = this.clients.keys().next().value as string | undefined;
        if (oldestKey === undefined) break;
        this.clients.delete(oldestKey);
        evictions += 1;
      }
      if (evictions > 0) {
        this.capacityPressureEvents += 1;
        this.evictionCount += evictions;
        this.logCapacityPressure(now);
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
    boundedMemoryStores.delete(this);
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

  private logCapacityPressure(now: number): void {
    if (
      this.lastCapacityLogAt !== null &&
      now - this.lastCapacityLogAt < RATE_LIMIT_CAPACITY_LOG_COOLDOWN_MS
    ) {
      return;
    }

    this.lastCapacityLogAt = now;
    logger.warn(
      {
        store: 'bounded-memory-rate-limit',
        maxKeys: this.maxKeys,
        activeKeys: this.clients.size,
        capacityPressureEvents: this.capacityPressureEvents,
        evictionCount: this.evictionCount,
      },
      'Rate-limit store capacity pressure; evicting least-recently-used identities',
    );
  }
}

export function getRateLimitCapacitySnapshot(): RateLimitCapacitySnapshot {
  const stores = [...boundedMemoryStores].map(store => ({
    store: store.storeName,
    ...store.getStats(),
  }));
  return {
    activeStores: stores.length,
    totalCapacityPressureEvents: stores.reduce(
      (total, store) => total + store.capacityPressureEvents,
      0,
    ),
    totalEvictions: stores.reduce((total, store) => total + store.evictionCount, 0),
    stores,
  };
}

/**
 * PostgreSQL-backed store for production. All instances use the same table,
 * database clock, and atomic upsert so a client cannot split a quota across
 * API processes.
 */
export class PostgresRateLimitStore implements Store {
  private windowMs = 60_000;
  private tableReady?: Promise<void>;
  private pool?: Promise<RateLimitStorePool>;

  constructor(
    private readonly limiterName: string,
    private readonly poolLoader: () => Promise<RateLimitStorePool> = () =>
      import('@workspace/db').then(({ pool }) => pool as RateLimitStorePool),
  ) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async get(key: string): Promise<StoredClient | undefined> {
    await this.ensureTable();
    const result = await (await this.getPool()).query<{
      total_hits: number;
      reset_time: string | Date;
    }>(
      `SELECT total_hits, reset_time
       FROM ${RATE_LIMIT_TABLE}
       WHERE limiter_name = $1 AND client_key = $2 AND reset_time > NOW()`,
      [this.limiterName, key],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      totalHits: row.total_hits,
      resetTime: new Date(row.reset_time),
    };
  }

  async increment(key: string): Promise<StoredClient> {
    try {
      await this.ensureTable();
      await this.cleanupExpired();
      const result = await (await this.getPool()).query<{
        total_hits: number;
        reset_time: string | Date;
      }>(
        `INSERT INTO ${RATE_LIMIT_TABLE}
           (limiter_name, client_key, total_hits, reset_time)
         VALUES ($1, $2, 1, NOW() + ($3::double precision * INTERVAL '1 millisecond'))
         ON CONFLICT (limiter_name, client_key)
         DO UPDATE SET
           total_hits = CASE
             WHEN ${RATE_LIMIT_TABLE}.reset_time <= NOW() THEN 1
             ELSE ${RATE_LIMIT_TABLE}.total_hits + 1
           END,
           reset_time = CASE
             WHEN ${RATE_LIMIT_TABLE}.reset_time <= NOW() THEN
               NOW() + ($3::double precision * INTERVAL '1 millisecond')
             ELSE ${RATE_LIMIT_TABLE}.reset_time
           END
         RETURNING total_hits, reset_time`,
        [this.limiterName, key, this.windowMs],
      );
      const row = result.rows[0];
      if (!row) throw new Error('Rate-limit store did not return an updated client');
      return {
        totalHits: row.total_hits,
        resetTime: new Date(row.reset_time),
      };
    } catch {
      throw new RateLimitStoreError();
    }
  }

  async decrement(key: string): Promise<void> {
    await this.ensureTable();
    await (await this.getPool()).query(
      `UPDATE ${RATE_LIMIT_TABLE}
       SET total_hits = GREATEST(total_hits - 1, 0)
       WHERE limiter_name = $1 AND client_key = $2 AND reset_time > NOW()`,
      [this.limiterName, key],
    );
  }

  async resetKey(key: string): Promise<void> {
    await this.ensureTable();
    await (await this.getPool()).query(
      `DELETE FROM ${RATE_LIMIT_TABLE}
       WHERE limiter_name = $1 AND client_key = $2`,
      [this.limiterName, key],
    );
  }

  private async getPool(): Promise<RateLimitStorePool> {
    this.pool ??= this.poolLoader();
    return this.pool;
  }

  private async cleanupExpired(): Promise<void> {
    // PostgreSQL rechecks this predicate after waiting on a concurrent row
    // lock, so a newer window cannot be removed by stale cleanup work.
    await (await this.getPool()).query(
      `DELETE FROM ${RATE_LIMIT_TABLE}
       WHERE reset_time <= NOW()`,
    );
  }

  private async ensureTable(): Promise<void> {
    this.tableReady ??= (async () => {
      await (await this.getPool()).query(`
        CREATE TABLE IF NOT EXISTS ${RATE_LIMIT_TABLE} (
          limiter_name TEXT NOT NULL,
          client_key TEXT NOT NULL,
          total_hits INTEGER NOT NULL,
          reset_time TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (limiter_name, client_key)
        )
      `);
    })();
    await this.tableReady;
  }
}

export class RateLimitStoreError extends Error {
  constructor() {
    super('Rate-limit store unavailable');
    this.name = 'RateLimitStoreError';
  }
}

export function handleRateLimitStoreError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!(error instanceof RateLimitStoreError)) {
    next(error);
    return;
  }

  res.status(503).json({
    error: 'Rate limiting is temporarily unavailable. Please try again shortly.',
  });
}

export function createRateLimitStore(
  limiterName: string,
  environment: RateLimitEnvironment = process.env,
): Store {
  if (shouldUseSharedRateLimitStore(environment)) {
    return new PostgresRateLimitStore(limiterName);
  }
  if (isProductionEnvironment(environment)) {
    throw new Error(
      'DATABASE_URL is required for production rate limiting; refusing to use a local store',
    );
  }
  return new BoundedMemoryStore(RATE_LIMIT_STORE_MAX_KEYS, limiterName);
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  store: createRateLimitStore('api'),
  skip: shouldSkipGeneralApiLimit,
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests — please try again in a few minutes.',
    quota: RATE_LIMIT_QUOTA_CATEGORIES.general,
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: createRateLimitStore('ai'),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI request limit reached. Please wait before sending more AI requests.',
    quota: RATE_LIMIT_QUOTA_CATEGORIES.ai,
  },
});

export const contentPackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: createRateLimitStore('content-pack'),
  keyGenerator: rateLimitKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Content pack refresh limit reached. Packs refresh automatically each week.',
    quota: RATE_LIMIT_QUOTA_CATEGORIES.contentPack,
  },
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
