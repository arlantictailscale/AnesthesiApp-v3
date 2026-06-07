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

    if (error.message === "Invalid login credentials") {
      // Check if the email exists in the profiles table to determine if they are registered
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email.trim())
        .maybeSingle()

      if (profileError) {
        console.error("Error checking user registration status:", profileError)
      }

      if (!data) {
        return { error: "Email is not registered. Please sign up first." }
      } else {
        return { error: "Incorrect password. Please try again." }
      }
    }

    return { error: error.message }
  }
  return {}
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = createClient()
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  })

  if (error) {
    console.error("signInWithGoogle error:", error)
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

// --- User Profile ---

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  title_role: string | null
  department: string | null
  bio: string | null
  avatar_url: string | null
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch user profile:", error.message)
    throw new Error(error.message)
  }

  if (!data) {
    // If profile row doesn't exist, create it as a fallback
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.id === userId) {
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, email: user.email ?? "" })
        .select("*")
        .single()
      if (insertError) {
        console.error("Failed to auto-create profile:", insertError.message)
        return null
      }
      return inserted as UserProfile
    }
    return null
  }

  return data as UserProfile
}

export async function updateUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", profile.id)
    .select("*")
    .single()

  if (error) {
    console.error("Failed to update user profile:", error.message)
    throw new Error(error.message)
  }

  return data as UserProfile
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
  const filePath = fileName

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    console.error("Failed to upload avatar:", error.message)
    throw new Error(error.message)
  }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath)

  return publicUrl
}

