import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a new API key.
 * Format: imcp_sk_<random_hex>
 */
export function generateApiKey(): string {
  const secret = randomBytes(24).toString('hex');
  return `imcp_sk_${secret}`;
}

/**
 * Hashes an API key for storage or comparison.
 */
export function hashKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extracts prefix for display in dashboard.
 */
export function getPrefix(apiKey: string): string {
  return apiKey.substring(0, 12) + '...';
}
