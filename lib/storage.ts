// Temporary client-side persistence layer.
// Replace with Supabase queries when the integration is connected.
"use client"

import type { CaseData, StoredCase } from "./schema"

const USERS_KEY = "anesthcase:users"
const SESSION_KEY = "anesthcase:session"
const CASES_KEY = "anesthcase:cases"
const DRAFT_KEY = "anesthcase:draft"

type User = { id: string; email: string; password: string; created_at: string }

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// --- Auth ---
export function signUp(email: string, password: string): { error?: string } {
  if (typeof window === "undefined") return { error: "No window" }
  const users = safeParse<User[]>(localStorage.getItem(USERS_KEY), [])
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with that email already exists." }
  }
  const user: User = {
    id: uid(),
    email,
    password, // NOTE: mock only — real auth should hash via Supabase
    created_at: new Date().toISOString(),
  }
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, email: user.email }))
  return {}
}

export function signIn(email: string, password: string): { error?: string } {
  if (typeof window === "undefined") return { error: "No window" }
  const users = safeParse<User[]>(localStorage.getItem(USERS_KEY), [])
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!user) return { error: "Invalid email or password." }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, email: user.email }))
  return {}
}

export function signOut() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): { userId: string; email: string } | null {
  if (typeof window === "undefined") return null
  return safeParse<{ userId: string; email: string } | null>(localStorage.getItem(SESSION_KEY), null)
}

// --- Cases ---
export function listCases(userId: string): StoredCase[] {
  if (typeof window === "undefined") return []
  const all = safeParse<StoredCase[]>(localStorage.getItem(CASES_KEY), [])
  return all
    .filter((c) => c.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export function getCase(id: string): StoredCase | null {
  if (typeof window === "undefined") return null
  const all = safeParse<StoredCase[]>(localStorage.getItem(CASES_KEY), [])
  return all.find((c) => c.id === id) ?? null
}

export function createCase(userId: string, data: CaseData): StoredCase {
  const all = safeParse<StoredCase[]>(localStorage.getItem(CASES_KEY), [])
  const record: StoredCase = {
    ...data,
    id: uid(),
    user_id: userId,
    created_at: new Date().toISOString(),
  }
  all.push(record)
  localStorage.setItem(CASES_KEY, JSON.stringify(all))
  return record
}

export function deleteCase(id: string) {
  if (typeof window === "undefined") return
  const all = safeParse<StoredCase[]>(localStorage.getItem(CASES_KEY), [])
  localStorage.setItem(CASES_KEY, JSON.stringify(all.filter((c) => c.id !== id)))
}

// --- Draft (wizard autosave) ---
export function saveDraft(data: Partial<CaseData>) {
  if (typeof window === "undefined") return
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function loadDraft(): Partial<CaseData> | null {
  if (typeof window === "undefined") return null
  return safeParse<Partial<CaseData> | null>(localStorage.getItem(DRAFT_KEY), null)
}

export function clearDraft() {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_KEY)
}
