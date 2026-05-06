import { Logger, LogContext } from './logger.js';
import { globalMetrics, RequestMetric } from './metrics.js';
import { globalRateLimiter } from './rate-limiter.js';

/**
 * Unified Observability layer for India-MCP.
 */
export class Observability {
  private logger: Logger;
  private serverName: string;

  constructor(serverName: string) {
    this.serverName = serverName;
    this.logger = new Logger(serverName);
  }

  /**
   * Tracks a complete request lifecycle.
   */
  async trackRequest<T>(
    endpoint: string,
    operation: () => Promise<T>,
    metadata: Partial<RequestMetric> = {}
  ): Promise<T> {
    const start = Date.now();
    let success = false;
    let retries = 0;

    // Extract domain for rate limiting
    let domain = 'default';
    try {
      if (endpoint.startsWith('http')) {
        domain = new URL(endpoint).hostname;
      }
    } catch (e) {}

    try {
      // 1. Apply Rate Limiting
      await globalRateLimiter.throttle(domain);

      // 2. Execute Operation
      const result = await operation();
      success = true;
      return result;
    } catch (error: any) {
      this.logger.error(`Request failed: ${endpoint}`, { error: error.message, endpoint });
      throw error;
    } finally {
      const durationMs = Date.now() - start;
      
      // 3. Record Metrics
      globalMetrics.recordRequest({
        endpoint,
        durationMs,
        success,
        retries: metadata.retries || 0,
        fallbackUsed: metadata.fallbackUsed || false,
        cacheHit: metadata.cacheHit || false,
        source: metadata.source || 'Unknown'
      });

      this.logger.debug(`Request completed`, { endpoint, durationMs, success });
    }
  }

  recordCache(hit: boolean, key: string): void {
    globalMetrics.recordCache(hit);
    this.logger.debug(`Cache ${hit ? 'HIT' : 'MISS'}`, { key });
  }

  getSystemSnapshot() {
    return globalMetrics.getSnapshot();
  }

  logInfo(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  logWarn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }
}
