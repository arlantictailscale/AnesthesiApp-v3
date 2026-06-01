"use client"

import { createClient } from "@/lib/supabase/client"
import { builtInDrugs } from "./drug-default-data"
import type { AnesthesiaDrug, DrugData } from "./schema"

const CUSTOM_DRUGS_KEY = "anesthesiapp:custom_drugs"

function generateId(): string {
  if (typeof window !== "undefined" && typeof window.crypto !== "undefined") {
    if (typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID()
    }
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function getLocalCustomDrugs(): AnesthesiaDrug[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CUSTOM_DRUGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCustomDrugs(drugs: AnesthesiaDrug[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CUSTOM_DRUGS_KEY, JSON.stringify(drugs))
  } catch (e) {
    console.error("Failed to save custom drugs locally:", e)
  }
}

/**
 * Lists all available drugs (from database, custom storage, or default fallback)
 */
export async function listDrugs(): Promise<AnesthesiaDrug[]> {
  const localCustom = getLocalCustomDrugs()
  let dbDrugs: AnesthesiaDrug[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("anesthesia_drugs")
      .select("*")
      .order("name", { ascending: true })

    if (!error && data) {
      dbDrugs = data as AnesthesiaDrug[]
    }
  } catch (err) {
    console.warn("Supabase listDrugs failed, falling back to localStorage & defaults:", err)
  }

  // If the database was accessible and returned standard drugs, dbDrugs already includes them.
  // Otherwise, we merge with builtInDrugs.
  const hasDbStandardDrugs = dbDrugs.some((d) => d.user_id === null)
  const baseStandardDrugs = hasDbStandardDrugs ? [] : builtInDrugs

  const allDrugs = [...dbDrugs, ...localCustom, ...baseStandardDrugs]
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  
  // Sort alphabetically by name
  allDrugs.sort((a, b) => a.name.localeCompare(b.name))

  return allDrugs.filter((drug) => {
    const normName = drug.name.trim().toLowerCase()
    if (seenIds.has(drug.id) || seenNames.has(normName)) return false
    seenIds.add(drug.id)
    seenNames.add(normName)
    return true
  })
}

/**
 * Gets a single drug by ID
 */
export async function getDrug(id: string): Promise<AnesthesiaDrug | null> {
  const drugs = await listDrugs()
  return drugs.find((d) => d.id === id) || null
}

/**
 * Creates and saves a new custom drug
 */
export async function createDrug(data: DrugData): Promise<AnesthesiaDrug> {
  const newDrug: AnesthesiaDrug = {
    ...data,
    id: generateId(),
    user_id: null,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newDrug.user_id = user.id
      const payload = {
        ...data,
        user_id: user.id,
      }
      const { data: inserted, error } = await supabase
        .from("anesthesia_drugs")
        .insert(payload)
        .select("*")
        .single()

      if (!error && inserted) {
        newDrug.id = inserted.id
        savedInDb = true
      } else if (error) {
        console.error("Supabase insert drug error:", error)
        throw new Error(error.message)
      }
    }
  } catch (err) {
    console.warn("Supabase createDrug failed, saving locally only:", err)
  }

  if (!savedInDb) {
    const local = getLocalCustomDrugs()
    local.unshift(newDrug)
    saveLocalCustomDrugs(local)
  }

  return newDrug
}

/**
 * Updates an existing custom drug
 */
export async function updateDrug(id: string, data: DrugData): Promise<AnesthesiaDrug> {
  const updatedDrug: AnesthesiaDrug = {
    ...data,
    id,
    user_id: null,
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      updatedDrug.user_id = user.id
      const payload = {
        ...data,
        user_id: user.id,
      }
      
      const { data: updated, error } = await supabase
        .from("anesthesia_drugs")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single()

      if (!error && updated) {
        savedInDb = true
      } else if (error) {
        console.warn("Supabase update drug error, falling back to local:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase updateDrug failed, updating locally only:", err)
  }

  // Update locally in localStorage
  const local = getLocalCustomDrugs()
  const idx = local.findIndex((d) => d.id === id)
  if (idx !== -1) {
    local[idx] = updatedDrug
    saveLocalCustomDrugs(local)
  } else if (!savedInDb) {
    local.unshift(updatedDrug)
    saveLocalCustomDrugs(local)
  }

  return updatedDrug
}

/**
 * Deletes a custom drug
 */
export async function deleteDrug(id: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("anesthesia_drugs").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase deleteDrug failed:", err)
  }

  // Always delete locally too
  const local = getLocalCustomDrugs()
  const filtered = local.filter((d) => d.id !== id)
  saveLocalCustomDrugs(filtered)
}
