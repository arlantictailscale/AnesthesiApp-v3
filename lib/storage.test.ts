// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const getUser = vi.fn()
const createClient = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClient(),
}))

import {
  saveDraft,
  loadDraft,
  clearDraft,
  getSession,
  listCases,
  deleteCases,
} from "./storage"

const DRAFT_KEY = "anesthesiapp:draft"

beforeEach(() => {
  localStorage.clear()
  getUser.mockReset()
  createClient.mockReset()
  createClient.mockReturnValue({ auth: { getUser } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("draft persistence", () => {
  it("saves a draft to localStorage as JSON", () => {
    saveDraft({ patient_name: "Jane", age: 30 })
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual({
      patient_name: "Jane",
      age: 30,
    })
  })

  it("loads a previously saved draft", () => {
    saveDraft({ room: "OR-2" })
    expect(loadDraft()).toEqual({ room: "OR-2" })
  })

  it("returns null when there is no draft", () => {
    expect(loadDraft()).toBeNull()
  })

  it("returns null when the stored draft is malformed JSON", () => {
    localStorage.setItem(DRAFT_KEY, "{not-json")
    expect(loadDraft()).toBeNull()
  })

  it("clears the stored draft", () => {
    saveDraft({ room: "OR-3" })
    clearDraft()
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    expect(loadDraft()).toBeNull()
  })
})

describe("getSession", () => {
  it("returns null when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await getSession()).toBeNull()
  })

  it("maps the authenticated user to a Session", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "a@b.com" } },
    })
    expect(await getSession()).toEqual({ userId: "user-1", email: "a@b.com" })
  })

  it("defaults email to an empty string when missing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } })
    expect(await getSession()).toEqual({ userId: "user-2", email: "" })
  })
})

describe("listCases", () => {
  it("returns an empty array when the user is not authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect(await listCases()).toEqual([])
  })
})

describe("deleteCases", () => {
  it("does nothing (and does not touch supabase) for an empty id list", async () => {
    await deleteCases([])
    expect(createClient).not.toHaveBeenCalled()
  })
})
