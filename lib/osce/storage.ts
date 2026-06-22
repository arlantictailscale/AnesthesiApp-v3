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
      dbStations = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        category: row.category,
        duration_minutes: row.duration_minutes,
        scenario: row.scenario,
        instructions_participant: row.instructions_participant,
        instructions_examiner: row.instructions_examiner,
        rubric: row.rubric,
        equipment: row.equipment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        creator_email: row.creator_email || undefined,
      })) as OsceStation[]
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
 * Gets a single OSCE attempt by ID
 */
export async function getOsceAttempt(id: string): Promise<OsceAttempt | null> {
  const attempts = await listOsceAttempts()
  return attempts.find((a) => a.id === id) || null
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
  station: Omit<OsceStation, "id" | "user_id" | "created_at" | "updated_at">,
  isDefault: boolean = false
): Promise<OsceStation> {
  const newStation: OsceStation = {
    ...station,
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15),
    user_id: isDefault ? null : "",
  }

  let savedInDb = false

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      newStation.user_id = isDefault ? null : user.id
      newStation.creator_email = isDefault ? undefined : (user.email || undefined)
      const payload = {
        title: station.title,
        category: station.category,
        duration_minutes: station.duration_minutes,
        scenario: station.scenario,
        instructions_participant: station.instructions_participant,
        instructions_examiner: station.instructions_examiner,
        rubric: station.rubric,
        equipment: station.equipment,
        user_id: isDefault ? null : user.id,
        creator_email: isDefault ? null : (user.email || null),
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
  station: Partial<Omit<OsceStation, "id" | "created_at" | "updated_at">>,
  isDefault: boolean = false
): Promise<OsceStation> {
  let savedInDb = false
  let updatedStation: OsceStation | null = null

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get existing to determine original user_id if we aren't forcing default
      let finalUserId: string | null = user.id
      if (isDefault) {
        finalUserId = null
      } else {
        const { data: existing } = await supabase
          .from("osce_stations")
          .select("user_id")
          .eq("id", id)
          .maybeSingle()
        if (existing) {
          finalUserId = existing.user_id
        }
      }

      const payload = {
        ...station,
        user_id: finalUserId,
        creator_email: finalUserId === null ? null : (user.email || null),
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

// --- Ratings and Comments for Community Hub ---

export interface OSCEComment {
  id: string
  user_id: string
  user_email: string
  station_id: string
  comment: string
  created_at: string
}

export interface OSCERatingsSummary {
  average: number
  count: number
  userRating?: number
}

/**
 * Submits or updates a rating (1-5) for an OSCE station
 */
export async function rateStation(stationId: string, rating: number): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Anda harus masuk log untuk memberikan rating.")
    }

    const { error } = await supabase
      .from("osce_ratings")
      .upsert({
        user_id: user.id,
        station_id: stationId,
        rating,
      }, {
        onConflict: "user_id,station_id"
      })

    if (error) throw new Error(error.message)
  } catch (err) {
    console.error("Failed to rate station:", err)
    throw err
  }
}

/**
 * Gets the average rating and review count for an OSCE station
 */
export async function getStationRatings(stationId: string): Promise<OSCERatingsSummary> {
  const defaultSummary: OSCERatingsSummary = { average: 0, count: 0 }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("osce_ratings")
      .select("rating, user_id")
      .eq("station_id", stationId)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return defaultSummary

    const count = data.length
    const total = data.reduce((acc: number, curr: any) => acc + curr.rating, 0)
    const average = Number((total / count).toFixed(1))

    let userRating: number | undefined = undefined
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const found = data.find((r: any) => r.user_id === user.id)
      if (found) userRating = found.rating
    }

    return { average, count, userRating }
  } catch (err) {
    console.warn("Failed to get station ratings, returning default:", err)
    return defaultSummary
  }
}

/**
 * Adds a new comment to an OSCE station discussion
 */
export async function addStationComment(stationId: string, comment: string): Promise<OSCEComment> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Anda harus masuk log untuk berkomentar.")
    }

    const payload = {
      user_id: user.id,
      user_email: user.email || "Anonim",
      station_id: stationId,
      comment,
    }

    const { data, error } = await supabase
      .from("osce_comments")
      .insert(payload)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    return {
      id: data.id,
      user_id: data.user_id,
      user_email: data.user_email,
      station_id: data.station_id,
      comment: data.comment,
      created_at: data.created_at,
    }
  } catch (err) {
    console.error("Failed to add comment:", err)
    throw err
  }
}

/**
 * Gets all comments for an OSCE station discussion
 */
export async function getStationComments(stationId: string): Promise<OSCEComment[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("osce_comments")
      .select("*")
      .eq("station_id", stationId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as OSCEComment[]
  } catch (err) {
    console.warn("Failed to get comments, returning empty array:", err)
    return []
  }
}
