/**
 * Centralized rate limiting with domain-based queues.
 */

interface RateLimitConfig {
  requestsPerSecond: number;
  burst?: number;
}

export class DomainRateLimiter {
  private static configs: Record<string, RateLimitConfig> = {
    'www.nseindia.com': { requestsPerSecond: 2, burst: 5 },
    'services.ecourts.gov.in': { requestsPerSecond: 1, burst: 3 },
    'foscos.fssai.gov.in': { requestsPerSecond: 1, burst: 2 },
    'default': { requestsPerSecond: 5 }
  };

  private queues: Map<string, Promise<void>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  async throttle(domain: string): Promise<void> {
    const config = DomainRateLimiter.configs[domain] || DomainRateLimiter.configs['default'];
    const interval = 1000 / config.requestsPerSecond;

    // Get current queue for this domain or create a resolved promise
    const currentQueue = this.queues.get(domain) || Promise.resolve();

    const nextRequest = currentQueue.then(async () => {
      const now = Date.now();
      const lastTime = this.lastRequestTime.get(domain) || 0;
      const timeSinceLast = now - lastTime;

      if (timeSinceLast < interval) {
        const delay = interval - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.lastRequestTime.set(domain, Date.now());
    });

    this.queues.set(domain, nextRequest);
    return nextRequest;
  }
}

export const globalRateLimiter = new DomainRateLimiter();
