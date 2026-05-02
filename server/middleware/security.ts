import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in a few minutes.' },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait before sending more AI requests.' },
});

export const contentPackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
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
