/**
 * Abuse detection — flags:
 * - Rapid-fire requests (many calls in short window)
 * - Repeated failed requests
 * - Suspicious patterns
 */

export interface AbuseReport {
  blocked: boolean;
  reason: string;
  severity: 'warn' | 'block';
}

interface KeyState {
  callTimestamps: number[];   // rolling window of recent call timestamps
  errorTimestamps: number[];  // recent errors
  registrationTimestamps: number[]; // recent registrations from same IP
  lastBlocked?: number;       // timestamp of last block
}

const WINDOW_MS = 60_000;           // 1-minute rolling window
const RAPID_FIRE_THRESHOLD = 30;    // >30 calls/minute → warn
const EXCESSIVE_THRESHOLD = 60;      // >60 calls/minute → block
const ERROR_BURST_THRESHOLD = 10;    // >10 errors/minute → block
const BLOCK_DURATION_MS = 60_000;    // 1-minute block after abuse

export interface AbuseDetector {
  check(userId: string | undefined, apiKeyId: string | undefined, ip: string): AbuseReport | null;
  recordExecution(userId: string | undefined, apiKeyId: string | undefined, ip: string, latency: number): void;
  recordRegistration(ip: string): void;
}

export function createAbuseDetector(): AbuseDetector {
  // key = apiKeyId or ip (split namespace)
  const states = new Map<string, KeyState>();

  function getState(key: string): KeyState {
    if (!states.has(key)) {
      states.set(key, { callTimestamps: [], errorTimestamps: [], registrationTimestamps: [] });
    }
    return states.get(key)!;
  }

  function cleanOld(now: number, entries: number[]): number[] {
    return entries.filter(t => now - t < WINDOW_MS);
  }

  function check(userId: string | undefined, apiKeyId: string | undefined, ip: string): AbuseReport | null {
    const now = Date.now();
    const keyId = apiKeyId ? `k:${apiKeyId}` : `i:${ip}`;

    // Check by IP as fallback
    const ipKey = `i:${ip}`;
    const state = getState(keyId);
    const ipState = getState(ipKey);

    const combinedTimestamps = [
      ...cleanOld(now, state.callTimestamps),
      ...cleanOld(now, ipState.callTimestamps)
    ];
    const combinedErrors = [
      ...cleanOld(now, state.errorTimestamps),
      ...cleanOld(now, ipState.errorTimestamps)
    ];

    // Check if currently blocked
    if (state.lastBlocked && now - state.lastBlocked < BLOCK_DURATION_MS) {
      return { blocked: true, reason: 'Too many requests. Temporarily blocked due to rate abuse.', severity: 'block' };
    }
    if (ipState.lastBlocked && now - ipState.lastBlocked < BLOCK_DURATION_MS) {
      return { blocked: true, reason: 'Too many requests from this IP. Temporarily blocked.', severity: 'block' };
    }

    // Excessive requests → block
    if (combinedTimestamps.length >= EXCESSIVE_THRESHOLD) {
      states.get(keyId)!.lastBlocked = now;
      states.get(ipKey)!.lastBlocked = now;
      return { blocked: true, reason: `Excessive request volume (${combinedTimestamps.length}/min). Blocked for ${BLOCK_DURATION_MS / 1000}s.`, severity: 'block' };
    }

    // Rapid-fire → warn (not block yet)
    if (combinedTimestamps.length >= RAPID_FIRE_THRESHOLD) {
      return { blocked: false, reason: `High request volume detected (${combinedTimestamps.length}/min). Consider batching requests.`, severity: 'warn' };
    }

    // Error burst → block
    if (combinedErrors.length >= ERROR_BURST_THRESHOLD) {
      return { blocked: true, reason: `High error rate detected (${combinedErrors.length} errors/min). Blocked for 60s to prevent abuse.`, severity: 'block' };
    }

    return null;
  }

  function recordExecution(userId: string | undefined, apiKeyId: string | undefined, ip: string, latency: number): void {
    const now = Date.now();
    const keyId = apiKeyId ? `k:${apiKeyId}` : `i:${ip}`;
    const ipKey = `i:${ip}`;

    for (const k of [keyId, ipKey]) {
      const s = getState(k);
      s.callTimestamps.push(now);
      s.callTimestamps = cleanOld(now, s.callTimestamps);
      if (latency > 10000) { // Treat very slow calls as potential issues
        s.errorTimestamps.push(now);
        s.errorTimestamps = cleanOld(now, s.errorTimestamps);
      }
    }
  }

  function recordRegistration(ip: string): void {
    const now = Date.now();
    const ipKey = `i:${ip}`;
    const s = getState(ipKey);
    s.registrationTimestamps.push(now);
    s.registrationTimestamps = cleanOld(now, s.registrationTimestamps);

    // Flag if many registrations from same IP in short time
    if (s.registrationTimestamps.length > 5) {
      s.lastBlocked = now;
    }
  }

  return { check, recordExecution, recordRegistration };
}
