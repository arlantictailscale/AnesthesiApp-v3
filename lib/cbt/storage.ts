"use client"

import { createClient } from "@/lib/supabase/client"
import { generateId, readLocalArray, writeLocalArray } from "@/lib/local-store"
import { createCommunityHub, type CommunityComment, type CommunityRatingsSummary } from "@/lib/community"
import { builtInPackages, type CBTPackage, type CBTQuestion } from "./default-data"

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

// Helper: load local items
function getLocalCustomPackages(): CBTPackage[] {
  return readLocalArray<CBTPackage>(CUSTOM_PACKAGES_KEY)
}

// Helper: save local items
function saveLocalCustomPackages(packages: CBTPackage[]) {
  writeLocalArray(CUSTOM_PACKAGES_KEY, packages)
}

// Helper: load local attempts
function getLocalAttempts(): CBTAttempt[] {
  return readLocalArray<CBTAttempt>(ATTEMPTS_KEY)
}

// Helper: save local attempts
function saveLocalAttempts(attempts: CBTAttempt[]) {
  writeLocalArray(ATTEMPTS_KEY, attempts)
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
        user_id: row.user_id,
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
  isDefault: boolean = false,
): Promise<CBTPackage> {
  const newPkg: CBTPackage = {
    id: generateId(),
    name,
    description,
    questions,
    user_id: isDefault ? null : undefined,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newPkg.creator_email = isDefault ? undefined : (user.email || undefined)
      newPkg.user_id = isDefault ? null : user.id
      const payload = {
        name,
        description,
        questions,
        user_id: isDefault ? null : user.id,
        creator_email: isDefault ? null : (user.email || null),
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
  isDefault: boolean = false,
): Promise<CBTPackage> {
  const updatedPkg: CBTPackage = {
    id,
    name,
    description,
    questions,
    user_id: isDefault ? null : undefined,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get existing to determine original user_id if we aren't forcing default
      let finalUserId: string | null = user.id
      if (isDefault) {
        finalUserId = null
      } else {
        const { data: existingPkg } = await supabase
          .from("cbt_packages")
          .select("user_id")
          .eq("id", id)
          .maybeSingle()
        if (existingPkg) {
          finalUserId = existingPkg.user_id
        }
      }

      updatedPkg.creator_email = finalUserId === null ? undefined : (user.email || undefined)
      updatedPkg.user_id = finalUserId

      const payload = {
        name,
        description,
        questions,
        user_id: finalUserId,
        creator_email: finalUserId === null ? null : (user.email || null),
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

export interface CBTComment extends CommunityComment {
  package_id: string
}

export type CBTRatingsSummary = CommunityRatingsSummary

const cbtHub = createCommunityHub<CBTComment>({
  ratingsTable: "cbt_ratings",
  commentsTable: "cbt_comments",
  foreignKey: "package_id",
  rateAuthError: "Anda harus masuk log untuk memberikan rating.",
  commentAuthError: "Anda harus masuk log untuk berkomentar.",
})

/**
 * Submits or updates a rating (1-5) for a package
 */
export function ratePackage(packageId: string, rating: number): Promise<void> {
  return cbtHub.rate(packageId, rating)
}

/**
 * Gets the average rating and review count, as well as the current user's rating if logged in
 */
export function getPackageRatings(packageId: string): Promise<CBTRatingsSummary> {
  return cbtHub.getRatings(packageId)
}

/**
 * Adds a new comment to a package discussion
 */
export function addComment(packageId: string, comment: string): Promise<CBTComment> {
  return cbtHub.addComment(packageId, comment)
}

/**
 * Gets all comments for a package discussion
 */
export function getPackageComments(packageId: string): Promise<CBTComment[]> {
  return cbtHub.getComments(packageId)
}
