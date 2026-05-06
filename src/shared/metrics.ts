/**
 * Performance and operational metrics tracking for India-MCP.
 */

export interface RequestMetric {
  endpoint: string;
  durationMs: number;
  success: boolean;
  retries: number;
  fallbackUsed: boolean;
  cacheHit: boolean;
  source: string;
}

export interface CacheMetric {
  hits: number;
  misses: number;
  size: number;
}

export class MetricsCollector {
  private requests: RequestMetric[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private totalRetries = 0;
  private totalFallbacks = 0;

  recordRequest(metric: RequestMetric): void {
    this.requests.push(metric);
    this.totalRetries += metric.retries;
    if (metric.fallbackUsed) this.totalFallbacks++;
    
    // Keep internal buffer manageable (last 1000 requests)
    if (this.requests.length > 1000) this.requests.shift();
  }

  recordCache(hit: boolean): void {
    if (hit) this.cacheHits++;
    else this.cacheMisses++;
  }

  getSnapshot() {
    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(r => r.success).length;
    const avgLatency = totalRequests > 0 
      ? this.requests.reduce((acc, r) => acc + r.durationMs, 0) / totalRequests 
      : 0;

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      averageLatencyMs: Math.round(avgLatency),
      cacheHitRate: (this.cacheHits + this.cacheMisses) > 0 
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 
        : 0,
      retryRate: totalRequests > 0 ? (this.totalRetries / totalRequests) : 0,
      fallbackRate: totalRequests > 0 ? (this.totalFallbacks / totalRequests) : 0
    };
  }
}

export const globalMetrics = new MetricsCollector();
