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
        creator_email: row.creator_email || undefined,
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
      newPkg.creator_email = user.email || undefined
      const payload = {
        name,
        description,
        questions,
        user_id: user.id,
        creator_email: user.email || null,
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
        throw new Error(error.message)
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
 * Updates an existing custom CBT package
 */
export async function updatePackage(
  id: string,
  name: string,
  description: string,
  questions: CBTQuestion[],
): Promise<CBTPackage> {
  const updatedPkg: CBTPackage = {
    id,
    name,
    description,
    questions,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      updatedPkg.creator_email = user.email || undefined
      const payload = {
        name,
        description,
        questions,
        user_id: user.id,
        creator_email: user.email || null,
      }
      
      const { data, error } = await supabase
        .from("cbt_packages")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single()

      if (!error && data) {
        savedInDb = true
      } else if (error) {
        console.warn("Supabase update package error, falling back to local:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase updatePackage failed, updating locally only:", err)
  }

  // Update locally in localStorage
  const local = getLocalCustomPackages()
  const idx = local.findIndex((p) => p.id === id)
  if (idx !== -1) {
    local[idx] = updatedPkg
    saveLocalCustomPackages(local)
  } else if (!savedInDb) {
    // Fallback: if not found locally and not saved in DB, add it locally
    local.unshift(updatedPkg)
    saveLocalCustomPackages(local)
  }

  return updatedPkg
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
        throw new Error(error.message)
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

/**
 * Deletes a past test attempt
 */
export async function deleteAttempt(id: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("cbt_attempts").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase deleteAttempt failed:", err)
  }

  // Always delete locally too
  const local = getLocalAttempts()
  const filtered = local.filter((a) => a.id !== id)
  saveLocalAttempts(filtered)
}

// --- Ratings and Comments for Community Hub ---

export interface CBTComment {
  id: string
  user_id: string
  user_email: string
  package_id: string
  comment: string
  created_at: string
}

export interface CBTRatingsSummary {
  average: number
  count: number
  userRating?: number
}

/**
 * Submits or updates a rating (1-5) for a package
 */
export async function ratePackage(packageId: string, rating: number): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Anda harus masuk log untuk memberikan rating.")
    }

    const { error } = await supabase
      .from("cbt_ratings")
      .upsert({
        user_id: user.id,
        package_id: packageId,
        rating,
      }, {
        onConflict: "user_id,package_id"
      })

    if (error) throw new Error(error.message)
  } catch (err) {
    console.error("Failed to rate package:", err)
    throw err
  }
}

/**
 * Gets the average rating and review count, as well as the current user's rating if logged in
 */
export async function getPackageRatings(packageId: string): Promise<CBTRatingsSummary> {
  const defaultSummary: CBTRatingsSummary = { average: 0, count: 0 }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cbt_ratings")
      .select("rating, user_id")
      .eq("package_id", packageId)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return defaultSummary

    const count = data.length
    const total = data.reduce((acc: number, curr: any) => acc + curr.rating, 0)
    const average = Number((total / count).toFixed(1))

    // Find current user rating if logged in
    let userRating: number | undefined = undefined
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const found = data.find((r: any) => r.user_id === user.id)
      if (found) userRating = found.rating
    }

    return { average, count, userRating }
  } catch (err) {
    console.warn("Failed to get package ratings, returning default:", err)
    return defaultSummary
  }
}

/**
 * Adds a new comment to a package discussion
 */
export async function addComment(packageId: string, comment: string): Promise<CBTComment> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Anda harus masuk log untuk berkomentar.")
    }

    const payload = {
      user_id: user.id,
      user_email: user.email || "Anonim",
      package_id: packageId,
      comment,
    }

    const { data, error } = await supabase
      .from("cbt_comments")
      .insert(payload)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    return {
      id: data.id,
      user_id: data.user_id,
      user_email: data.user_email,
      package_id: data.package_id,
      comment: data.comment,
      created_at: data.created_at,
    }
  } catch (err) {
    console.error("Failed to add comment:", err)
    throw err
  }
}

/**
 * Gets all comments for a package discussion
 */
export async function getPackageComments(packageId: string): Promise<CBTComment[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("cbt_comments")
      .select("*")
      .eq("package_id", packageId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as CBTComment[]
  } catch (err) {
    console.warn("Failed to get comments, returning empty array:", err)
    return []
  }
}
