"use client"

import { createClient } from "@/lib/supabase/client"
import { generateId, readLocalArray, writeLocalArray } from "@/lib/local-store"
import { builtInGuidelines } from "./default-data"
import type { AnesthesiaGuideline, GuidelineData } from "./schema"

const CUSTOM_GUIDELINES_KEY = "anesthesiapp:custom_guidelines"

function getLocalCustomGuidelines(): AnesthesiaGuideline[] {
  return readLocalArray<AnesthesiaGuideline>(CUSTOM_GUIDELINES_KEY)
}

function saveLocalCustomGuidelines(guidelines: AnesthesiaGuideline[]) {
  writeLocalArray(CUSTOM_GUIDELINES_KEY, guidelines)
}

/**
 * Uploads a guideline attachment (PDF or image) to Supabase Storage bucket 'guideline-files'
 */
export async function uploadGuidelineFile(file: File): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = `guidelines/${fileName}`

  const { data, error } = await supabase.storage
    .from("guideline-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message || "Failed to upload file to storage bucket.")
  }

  const { data: { publicUrl } } = supabase.storage
    .from("guideline-files")
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Lists all guidelines (from database, custom storage, or default fallback)
 */
export async function listGuidelines(): Promise<AnesthesiaGuideline[]> {
  const localCustom = getLocalCustomGuidelines()
  let dbGuidelines: AnesthesiaGuideline[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("anesthesia_guidelines")
      .select("*")
      .order("title", { ascending: true })

    if (!error && data) {
      dbGuidelines = data as AnesthesiaGuideline[]
    }
  } catch (err) {
    console.warn("Supabase listGuidelines failed, falling back to localStorage & defaults:", err)
  }

  // If the database returned standard guidelines, we don't need to append the built-in fallbacks.
  const hasDbStandard = dbGuidelines.some((g) => g.user_id === null)
  const baseStandard = hasDbStandard ? [] : builtInGuidelines

  const allGuidelines = [...dbGuidelines, ...localCustom, ...baseStandard]
  const seenIds = new Set<string>()
  const seenTitles = new Set<string>()

  // Sort alphabetically by title
  allGuidelines.sort((a, b) => a.title.localeCompare(b.title))

  return allGuidelines
    .map((g: any) => ({
      ...g,
      file_urls: Array.isArray(g.file_urls) ? g.file_urls : (g.file_url ? [{ name: "Official Reference File", url: g.file_url }] : []),
      image_urls: Array.isArray(g.image_urls) ? g.image_urls : (g.image_url ? [g.image_url] : []),
    }))
    .filter((guide) => {
      const normTitle = guide.title.trim().toLowerCase()
      if (seenIds.has(guide.id) || seenTitles.has(normTitle)) return false
      seenIds.add(guide.id)
      seenTitles.add(normTitle)
      return true
    })
}

/**
 * Gets a single guideline by ID
 */
export async function getGuideline(id: string): Promise<AnesthesiaGuideline | null> {
  const guidelines = await listGuidelines()
  return guidelines.find((g) => g.id === id) || null
}

/**
 * Creates and saves a new custom guideline
 */
export async function createGuideline(data: GuidelineData): Promise<AnesthesiaGuideline> {
  const newGuideline: AnesthesiaGuideline = {
    ...data,
    id: generateId(),
    user_id: null,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newGuideline.user_id = user.id
      const payload = {
        ...data,
        user_id: user.id,
      }
      const { data: inserted, error } = await supabase
        .from("anesthesia_guidelines")
        .insert(payload)
        .select("*")
        .single()

      if (!error && inserted) {
        newGuideline.id = inserted.id
        savedInDb = true
      } else if (error) {
        console.error("Supabase insert guideline error:", error)
        throw new Error(error.message)
      }
    }
  } catch (err) {
    console.warn("Supabase createGuideline failed, saving locally only:", err)
  }

  if (!savedInDb) {
    const local = getLocalCustomGuidelines()
    local.unshift(newGuideline)
    saveLocalCustomGuidelines(local)
  }

  return newGuideline
}

/**
 * Updates an existing custom guideline
 */
export async function updateGuideline(id: string, data: GuidelineData): Promise<AnesthesiaGuideline> {
  const updatedGuideline: AnesthesiaGuideline = {
    ...data,
    id,
    user_id: null,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      updatedGuideline.user_id = user.id
      const payload = {
        ...data,
        user_id: user.id,
      }

      const { data: updated, error } = await supabase
        .from("anesthesia_guidelines")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single()

      if (!error && updated) {
        savedInDb = true
      } else if (error) {
        console.warn("Supabase update guideline error, falling back to local:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase updateGuideline failed, updating locally only:", err)
  }

  // Update locally in localStorage
  const local = getLocalCustomGuidelines()
  const idx = local.findIndex((g) => g.id === id)
  if (idx !== -1) {
    local[idx] = updatedGuideline
    saveLocalCustomGuidelines(local)
  } else if (!savedInDb) {
    local.unshift(updatedGuideline)
    saveLocalCustomGuidelines(local)
  }

  return updatedGuideline
}

/**
 * Deletes a custom guideline
 */
export async function deleteGuideline(id: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("anesthesia_guidelines").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase deleteGuideline failed:", err)
  }

  // Always delete locally too
  const local = getLocalCustomGuidelines()
  const filtered = local.filter((g) => g.id !== id)
  saveLocalCustomGuidelines(filtered)
}
