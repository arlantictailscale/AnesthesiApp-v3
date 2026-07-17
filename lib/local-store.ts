"use client"

/**
 * Shared helpers for client-side persistence and id generation used by the
 * feature storage modules (cbt, osce, drugs, guidelines, cases).
 */

/**
 * Generates a unique id, preferring the platform's crypto APIs and falling back
 * to a Math.random based value when they are unavailable.
 */
export function generateId(): string {
  if (typeof window !== "undefined" && typeof window.crypto !== "undefined") {
    if (typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID()
    }
    if (typeof window.crypto.getRandomValues === "function") {
      try {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (Number(c) ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
        )
      } catch {
        // ignore and fallback
      }
    }
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Reads and parses an array persisted under `key` in localStorage. Returns an
 * empty array on the server, when nothing is stored, or when parsing fails.
 */
export function readLocalArray<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

/**
 * Persists an array under `key` in localStorage. No-op on the server; logs and
 * swallows any write errors (e.g. quota exceeded).
 */
export function writeLocalArray<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to save "${key}" to localStorage:`, e)
  }
}
