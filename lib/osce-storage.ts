"use client"

import { createClient } from "@/lib/supabase/client"
import { builtInOsceStations } from "./osce-default-data"
import type { OsceStation, OsceAttempt } from "./osce-default-data"

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
