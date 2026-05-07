'use client'

/**
 * Centralized authentication utility for India-MCP Playground.
 * Manages API key persistence in localStorage under the key "india-mcp-api-key".
 */

const API_KEY_STORAGE_KEY = 'india-mcp-api-key'
const LEGACY_API_KEY_STORAGE_KEY = 'imcp_api_key'

/**
 * Save an API key to localStorage.
 * Replaces any existing key under the canonical key name.
 */
export function saveApiKey(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key)
  } catch {
    // localStorage unavailable
  }
}

/**
 * Retrieve the stored API key from localStorage.
 * Returns null if no key is stored or on server-side.
 * Handles migration from legacy key name.
 */
export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // Migrate legacy key on first read
    const legacy = localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY)
    if (legacy) {
      localStorage.setItem(API_KEY_STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY)
      return legacy
    }
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Remove the stored API key from localStorage.
 */
export function clearApiKey(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Returns true if an API key is currently stored.
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null
}

/**
 * Masked display of the API key for UI purposes.
 * Shows first 8 chars + "..." + last 4 chars.
 * Returns null if no key is stored.
 */
export function maskApiKey(key: string): string | null {
  if (!key) return null
  if (key.length <= 16) return key
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}
