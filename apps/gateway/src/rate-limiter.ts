/**
 * Simple in-memory sliding-window rate limiter.
 * Tracks requests per key (API key hash or IP) within rolling time windows.
 */

interface WindowEntry {
  count: number;
  oldestTs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  retryAfterMs: number;
}

type LimitKind = 'key' | 'ip';

const WINDOWS: Array<{ requests: number; windowMs: number }> = [
  { requests: 100, windowMs: 60_000 },   // 1 min
  { requests: 500, windowMs: 300_000 },  // 5 min
];

interface Tracker {
  windows: Map<string, WindowEntry>; // windowId -> { count, oldestTs }
}

interface Store {
  key: Tracker;
  ip: Tracker;
}

function createTracker(): Tracker {
  return { windows: new Map() };
}

export interface RateLimiterStore {
  check(identifier: string, kind: LimitKind, limit: number, windowMs: number): RateLimitResult;
  getStats(): Record<string, unknown>;
}

export function createRateLimiter(): RateLimiterStore {
  const store: Store = {
    key: createTracker(),
    ip: createTracker()
  };

  function check(identifier: string, kind: LimitKind, limit: number, windowMs: number): RateLimitResult {
    const tracker = store[kind];
    const now = Date.now();
    const windowId = `${windowMs}`;

    let entry = tracker.windows.get(windowId + ':' + identifier);

    if (!entry || now - entry.oldestTs > windowMs) {
      // Start new window
      entry = { count: 1, oldestTs: now };
      tracker.windows.set(windowId + ':' + identifier, entry);
      return { allowed: true, remaining: limit - 1, resetInMs: windowMs, retryAfterMs: 0 };
    }

    if (entry.count >= limit) {
      const retryAfterMs = windowMs - (now - entry.oldestTs);
      return { allowed: false, remaining: 0, resetInMs: retryAfterMs, retryAfterMs };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetInMs: windowMs - (now - entry.oldestTs),
      retryAfterMs: 0
    };
  }

  function getStats() {
    const totalKeyWindows = Array.from(store.key.windows.values()).reduce((s, e) => s + e.count, 0);
    const totalIpWindows = Array.from(store.ip.windows.values()).reduce((s, e) => s + e.count, 0);
    return {
      trackedKeys: store.key.windows.size,
      trackedIps: store.ip.windows.size,
      totalKeyRequests: totalKeyWindows,
      totalIpRequests: totalIpWindows
    };
  }

  return { check, getStats };
}
