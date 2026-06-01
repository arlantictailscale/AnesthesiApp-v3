"use client"

import { createClient } from "@/lib/supabase/client"
import { builtInOsceStations } from "./default-data"
import type { OsceStation, OsceAttempt } from "./default-data"

const OSCE_CUSTOM_STATIONS_KEY = "anesthesiapp:osce_stations"
const OSCE_ATTEMPTS_KEY = "anesthesiapp:osce_attempts"

function getLocalCustomStations(): OsceStation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(OSCE_CUSTOM_STATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCustomStations(stations: OsceStation[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(OSCE_CUSTOM_STATIONS_KEY, JSON.stringify(stations))
  } catch (e) {
    console.error("Failed to save OSCE custom stations locally:", e)
  }
}

function getLocalAttempts(): OsceAttempt[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(OSCE_ATTEMPTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalAttempt(attempt: OsceAttempt) {
  if (typeof window === "undefined") return
  try {
    const local = getLocalAttempts()
    local.unshift(attempt)
    localStorage.setItem(OSCE_ATTEMPTS_KEY, JSON.stringify(local))
  } catch (e) {
    console.error("Failed to save OSCE attempt locally:", e)
  }
}

/**
 * Lists all OSCE Stations
 */
export async function listOsceStations(): Promise<OsceStation[]> {
  const localCustom = getLocalCustomStations()
  let dbStations: OsceStation[] = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("osce_stations")
      .select("*")
      .order("title", { ascending: true })

    if (!error && data) {
      dbStations = data as OsceStation[]
    }
  } catch (err) {
    console.warn("Supabase listOsceStations failed, falling back to localStorage & defaults:", err)
  }

  const hasDbStandard = dbStations.some((s) => s.user_id === null)
  const baseStandard = hasDbStandard ? [] : builtInOsceStations

  const allStations = [...dbStations, ...localCustom, ...baseStandard]
  const seenIds = new Set<string>()

  return allStations.filter((s) => {
    if (seenIds.has(s.id)) return false
    seenIds.add(s.id)
    return true
  })
}

/**
 * Gets a single OSCE station by ID
 */
export async function getOsceStation(id: string): Promise<OsceStation | null> {
  const stations = await listOsceStations()
  return stations.find((s) => s.id === id || s.id.includes(id)) || null
}

/**
 * Lists all practice attempts for the current user
 */
export async function listOsceAttempts(): Promise<OsceAttempt[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("osce_attempts")
      .select("*")
      .order("completed_at", { ascending: false })

    if (!error && data) {
      return data as OsceAttempt[]
    }
  } catch (err) {
    console.warn("Supabase listOsceAttempts failed, using local history:", err)
  }

  return getLocalAttempts()
}

/**
 * Saves a completed OSCE practice session attempt
 */
export async function saveOsceAttempt(
  attemptData: Omit<OsceAttempt, "id" | "user_id" | "completed_at" | "started_at"> & {
    started_at: string
  }
): Promise<OsceAttempt> {
  const attemptId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15)

  const newAttempt: OsceAttempt = {
    ...attemptData,
    id: attemptId,
    user_id: "",
    started_at: attemptData.started_at,
    completed_at: new Date().toISOString()
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newAttempt.user_id = user.id
      const payload = {
        ...newAttempt,
        user_id: user.id
      }
      
      const { data, error } = await supabase
        .from("osce_attempts")
        .insert(payload)
        .select("*")
        .single()

      if (!error && data) {
        savedInDb = true
        return data as OsceAttempt
      } else if (error) {
        console.error("Supabase insert OSCE attempt error:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase saveOsceAttempt failed, saving locally:", err)
  }

  if (!savedInDb) {
    saveLocalAttempt(newAttempt)
  }

  return newAttempt
}

/**
 * Creates and saves a new custom OSCE station
 */
export async function createOsceStation(
  station: Omit<OsceStation, "id" | "user_id" | "created_at" | "updated_at">
): Promise<OsceStation> {
  const newStation: OsceStation = {
    ...station,
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15),
    user_id: "",
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newStation.user_id = user.id
      const payload = {
        title: station.title,
        category: station.category,
        duration_minutes: station.duration_minutes,
        scenario: station.scenario,
        instructions_participant: station.instructions_participant,
        instructions_examiner: station.instructions_examiner,
        rubric: station.rubric,
        equipment: station.equipment,
        user_id: user.id,
      }
      const { data, error } = await supabase
        .from("osce_stations")
        .insert(payload)
        .select("*")
        .single()

      if (!error && data) {
        newStation.id = data.id
        savedInDb = true
      } else if (error) {
        console.error("Supabase insert OSCE station error:", error)
        throw new Error(error.message)
      }
    }
  } catch (err) {
    console.warn("Supabase createOsceStation failed, saving locally only:", err)
  }

  if (!savedInDb) {
    const local = getLocalCustomStations()
    local.unshift(newStation)
    saveLocalCustomStations(local)
  }

  return newStation
}

/**
 * Updates an existing custom OSCE station
 */
export async function updateOsceStation(
  id: string,
  station: Partial<Omit<OsceStation, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<OsceStation> {
  let savedInDb = false
  let updatedStation: OsceStation | null = null

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const payload = {
        ...station,
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await supabase
        .from("osce_stations")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single()

      if (!error && data) {
        updatedStation = data as OsceStation
        savedInDb = true
      } else if (error) {
        console.warn("Supabase update OSCE station error, falling back to local:", error)
      }
    }
  } catch (err) {
    console.warn("Supabase updateOsceStation failed, updating locally only:", err)
  }

  // Update locally in localStorage
  const local = getLocalCustomStations()
  const idx = local.findIndex((s) => s.id === id)
  
  if (idx !== -1) {
    const existing = local[idx]
    const merged = {
      ...existing,
      ...station,
      updated_at: new Date().toISOString()
    } as OsceStation
    local[idx] = merged
    saveLocalCustomStations(local)
    if (!updatedStation) {
      updatedStation = merged
    }
  } else if (!savedInDb) {
    // If not found locally but we didn't save in DB, let's create a placeholder
    const stations = await listOsceStations()
    const existing = stations.find((s) => s.id === id)
    if (existing) {
      const merged = {
        ...existing,
        ...station,
        updated_at: new Date().toISOString()
      } as OsceStation
      local.unshift(merged)
      saveLocalCustomStations(local)
      updatedStation = merged
    }
  }

  if (!updatedStation) {
    throw new Error("Station not found to update")
  }

  return updatedStation
}

/**
 * Deletes a custom OSCE station
 */
export async function deleteOsceStation(id: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from("osce_stations").delete().eq("id", id)
  } catch (err) {
    console.warn("Supabase deleteOsceStation failed:", err)
  }

  // Always delete locally too
  const local = getLocalCustomStations()
  const filtered = local.filter((s) => s.id !== id)
  saveLocalCustomStations(filtered)
}
