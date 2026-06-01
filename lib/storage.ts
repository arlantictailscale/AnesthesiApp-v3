"use client"

import { createClient } from "@/lib/supabase/client"
import type { CaseData, StoredCase } from "./schema"

const DRAFT_KEY = "anesthesiapp:draft"

export type Session = { userId: string; email: string }

// --- Auth ---

export async function signUp(
  email: string,
  password: string,
): Promise<{ error?: string; needsEmailConfirmation?: boolean }> {
  const supabase = createClient()
  const redirectTo =
    (typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${window.location.origin}/auth/callback`
      : undefined)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    console.error("[v0] supabase.auth.signUp error:", {
      message: error.message,
      status: error.status,
      code: (error as { code?: string }).code,
    })
    return { error: error.message }
  }

  // If email confirmation is required, there's a user but no session yet.
  const needsEmailConfirmation = !data.session && !!data.user
  return { needsEmailConfirmation }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error("[v0] supabase.auth.signInWithPassword error:", {
      message: error.message,
      status: error.status,
      code: (error as { code?: string }).code,
    })
    return { error: error.message }
  }
  return {}
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, email: user.email ?? "" }
}

// --- Cases ---

export async function listCases(): Promise<StoredCase[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("anesthesia_cases")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as StoredCase[]
}

export async function getCase(id: string): Promise<StoredCase | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("anesthesia_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data ?? null) as StoredCase | null
}

export async function createCase(
  userId: string,
  data: CaseData,
): Promise<StoredCase> {
  const supabase = createClient()
  const payload = { ...data, user_id: userId }
  const { data: inserted, error } = await supabase
    .from("anesthesia_cases")
    .insert(payload)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return inserted as StoredCase
}

export async function deleteCase(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("anesthesia_cases").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function listSharedCases(): Promise<StoredCase[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("anesthesia_cases")
    .select("*")
    .eq("is_shared", true)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as StoredCase[]
}

export async function updateCase(
  id: string,
  data: Partial<CaseData>,
): Promise<StoredCase> {
  const supabase = createClient()
  const { data: updated, error } = await supabase
    .from("anesthesia_cases")
    .update(data)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return updated as StoredCase
}

// --- Draft (wizard autosave, local only) ---

export function saveDraft(data: Partial<CaseData>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function loadDraft(): Partial<CaseData> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<CaseData>
  } catch {
    return null
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_KEY)
}
