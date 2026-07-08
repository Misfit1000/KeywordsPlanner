import express, { type NextFunction, type Request, type Response } from 'express';

type RateLimitOptions = {
  namespace: string;
  windowMs: number;
  maxRequests: number;
  maxKeys?: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();
const DEFAULT_RATE_LIMIT_MAX_KEYS = 10_000;

export function apiSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  next();
}

export function jsonBodyParser() {
  return express.json({
    limit: process.env.API_JSON_BODY_LIMIT || '64kb',
    strict: true,
  });
}

export function jsonParseErrorHandler(error: any, _req: Request, res: Response, next: NextFunction) {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body is too large',
    });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON request body',
    });
  }

  next(error);
}

export function apiErrorHandler(error: any, req: Request, res: Response, _next: NextFunction) {
  console.error('[api] unhandled route error', {
    message: error?.message,
    stack: error?.stack,
    method: req.method,
    url: req.originalUrl || req.url,
  });

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

function clientIp(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return req.ip || req.socket.remoteAddress || forwardedValue?.split(',')[0]?.trim() || 'unknown';
}

function storeFor(namespace: string) {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

function pruneStore(store: Map<string, RateLimitEntry>, now: number, maxKeys: number) {
  if (store.size <= maxKeys) {
    return;
  }

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  while (store.size > maxKeys) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) {
      break;
    }
    store.delete(oldestKey);
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const store = storeFor(options.namespace);
    pruneStore(store, now, options.maxKeys || DEFAULT_RATE_LIMIT_MAX_KEYS);
    const key = `${clientIp(req)}:${req.method}:${req.path}`;
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    current.count += 1;
    if (current.count <= options.maxRequests) {
      return next();
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please retry shortly.',
    });
  };
}
