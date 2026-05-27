"use client"

import { createClient } from "@/lib/supabase/client"
import { builtInPackages, type CBTPackage, type CBTQuestion } from "./cbt-default-data"

export interface CBTAttempt {
  id: string
  user_id?: string
  package_id: string
  package_name: string
  score: number
  total_questions: number
  correct_count: number
  time_spent: number // in seconds
  answers: Record<string, string> // e.g. {"0": "A", "1": "C"}
  created_at: string
}

const CUSTOM_PACKAGES_KEY = "anesthesiapp:cbt_custom_packages"
const ATTEMPTS_KEY = "anesthesiapp:cbt_attempts"

function generateId(): string {
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

// Helper: load local items
function getLocalCustomPackages(): CBTPackage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_PACKAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Helper: save local items
function saveLocalCustomPackages(packages: CBTPackage[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CUSTOM_PACKAGES_KEY, JSON.stringify(packages))
  } catch (e) {
    console.error("Failed to save custom packages locally:", e)
  }
}

// Helper: load local attempts
function getLocalAttempts(): CBTAttempt[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Helper: save local attempts
function saveLocalAttempts(attempts: CBTAttempt[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch (e) {
    console.error("Failed to save attempts locally:", e)
  }
}

// --- API ---

/**
 * Lists all available CBT packages (built-in + custom from Supabase/localStorage)
 */
export async function listPackages(): Promise<CBTPackage[]> {
  const localCustom = getLocalCustomPackages()
  let dbCustom: CBTPackage[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cbt_packages")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      dbCustom = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || "",
        questions: row.questions as CBTQuestion[],
      }))
    }
  } catch (err) {
    console.warn("Supabase listPackages failed, falling back to localStorage:", err)
  }

  // Combine and deduplicate by ID, prioritizing database packages over built-in fallbacks
  const allPackages = [...dbCustom, ...builtInPackages, ...localCustom]
  const seenIds = new Set<string>()
  return allPackages.filter((pkg) => {
    if (seenIds.has(pkg.id)) return false
    seenIds.add(pkg.id)
    return true
  })
}

/**
 * Gets a single package by ID
 */
export async function getPackage(id: string): Promise<CBTPackage | null> {
  const packages = await listPackages()
  return packages.find((p) => p.id === id) || null
}

/**
 * Creates and saves a new custom CBT package
 */
export async function createPackage(
  name: string,
  description: string,
  questions: CBTQuestion[],
): Promise<CBTPackage> {
  const newPkg: CBTPackage = {
    id: generateId(),
    name,
    description,
    questions,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const payload = {
        name,
        description,
        questions,
        user_id: user.id,
      }
      const { data, error } = await supabase
        .from("cbt_packages")
        .insert(payload)
        .select("*")
        .single()

      if (!error && data) {
        newPkg.id = data.id
        savedInDb = true
      } else if (error) {
        console.error("Supabase insert package error:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase createPackage failed, saving locally only:", err)
  }

  if (!savedInDb) {
    const local = getLocalCustomPackages()
    local.unshift(newPkg)
    saveLocalCustomPackages(local)
  }

  return newPkg
}

/**
 * Deletes a custom package
 */
export async function deletePackage(id: string): Promise<void> {
  // Try deleting from database first
  try {
    const supabase = createClient()
    await supabase.from("cbt_packages").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase deletePackage failed:", err)
  }

  // Always delete locally too
  const local = getLocalCustomPackages()
  const filtered = local.filter((p) => p.id !== id)
  saveLocalCustomPackages(filtered)
}

/**
 * Lists past test attempts
 */
export async function listAttempts(): Promise<CBTAttempt[]> {
  const localAttempts = getLocalAttempts()
  let dbAttempts: CBTAttempt[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cbt_attempts")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      // Find package names
      const packages = await listPackages()
      dbAttempts = data.map((row: any) => {
        const pkg = packages.find((p) => p.id === row.package_id)
        return {
          id: row.id,
          user_id: row.user_id,
          package_id: row.package_id,
          package_name: pkg ? pkg.name : "Paket Kustom",
          score: Number(row.score),
          total_questions: row.total_questions,
          correct_count: row.correct_count,
          time_spent: row.time_spent,
          answers: row.answers as Record<string, string>,
          created_at: row.created_at,
        }
      })
    }
  } catch (err) {
    console.warn("Supabase listAttempts failed, falling back to localStorage:", err)
  }

  // Combine and sort by date descending
  const allAttempts = [...dbAttempts, ...localAttempts]
  allAttempts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Deduplicate
  const seenIds = new Set<string>()
  return allAttempts.filter((att) => {
    if (seenIds.has(att.id)) return false
    seenIds.add(att.id)
    return true
  })
}

/**
 * Gets a single attempt by ID
 */
export async function getAttempt(id: string): Promise<CBTAttempt | null> {
  const attempts = await listAttempts()
  return attempts.find((a) => a.id === id) || null
}

/**
 * Saves a completed CBT attempt
 */
export async function saveAttempt(attempt: Omit<CBTAttempt, "id" | "created_at">): Promise<CBTAttempt> {
  const newAttempt: CBTAttempt = {
    ...attempt,
    id: generateId(),
    created_at: new Date().toISOString(),
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newAttempt.user_id = user.id
      const payload = {
        package_id: attempt.package_id,
        score: attempt.score,
        total_questions: attempt.total_questions,
        correct_count: attempt.correct_count,
        time_spent: attempt.time_spent,
        answers: attempt.answers,
        user_id: user.id,
      }
      const { data, error } = await supabase
        .from("cbt_attempts")
        .insert(payload)
        .select("*")
        .single()

      if (!error && data) {
        newAttempt.id = data.id
        savedInDb = true
      } else if (error) {
        console.error("Supabase save attempt error:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase saveAttempt failed, saving locally only:", err)
  }

  // Save locally as a copy/fallback
  const local = getLocalAttempts()
  local.unshift(newAttempt)
  saveLocalAttempts(local)

  return newAttempt
}
