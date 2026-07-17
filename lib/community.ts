"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * Shared "Community Hub" logic (star ratings + threaded comments) reused by the
 * CBT packages and OSCE stations. Each feature has its own ratings/comments
 * tables that share the same shape, differing only in the foreign-key column
 * pointing back at the rated entity.
 */

export interface CommunityRatingsSummary {
  average: number
  count: number
  userRating?: number
}

export interface CommunityComment {
  id: string
  user_id: string
  user_email: string
  comment: string
  created_at: string
}

export interface CommunityHubConfig {
  /** Table holding one rating row per (user, entity). */
  ratingsTable: string
  /** Table holding discussion comments. */
  commentsTable: string
  /** Foreign-key column referencing the rated entity (e.g. "package_id"). */
  foreignKey: string
  /** Message shown when an unauthenticated user tries to rate. */
  rateAuthError: string
  /** Message shown when an unauthenticated user tries to comment. */
  commentAuthError: string
}

export interface CommunityHub<TComment extends CommunityComment> {
  rate(entityId: string, rating: number): Promise<void>
  getRatings(entityId: string): Promise<CommunityRatingsSummary>
  addComment(entityId: string, comment: string): Promise<TComment>
  getComments(entityId: string): Promise<TComment[]>
}

export function createCommunityHub<TComment extends CommunityComment>(
  config: CommunityHubConfig,
): CommunityHub<TComment> {
  const { ratingsTable, commentsTable, foreignKey, rateAuthError, commentAuthError } = config

  async function rate(entityId: string, rating: number): Promise<void> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error(rateAuthError)
      }

      const { error } = await supabase
        .from(ratingsTable)
        .upsert(
          {
            user_id: user.id,
            [foreignKey]: entityId,
            rating,
          },
          {
            onConflict: `user_id,${foreignKey}`,
          },
        )

      if (error) throw new Error(error.message)
    } catch (err) {
      console.error("Failed to submit rating:", err)
      throw err
    }
  }

  async function getRatings(entityId: string): Promise<CommunityRatingsSummary> {
    const defaultSummary: CommunityRatingsSummary = { average: 0, count: 0 }
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from(ratingsTable)
        .select("rating, user_id")
        .eq(foreignKey, entityId)

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
      console.warn("Failed to get ratings, returning default:", err)
      return defaultSummary
    }
  }

  async function addComment(entityId: string, comment: string): Promise<TComment> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error(commentAuthError)
      }

      const payload = {
        user_id: user.id,
        user_email: user.email || "Anonim",
        [foreignKey]: entityId,
        comment,
      }

      const { data, error } = await supabase
        .from(commentsTable)
        .insert(payload)
        .select("*")
        .single()

      if (error) throw new Error(error.message)
      return data as TComment
    } catch (err) {
      console.error("Failed to add comment:", err)
      throw err
    }
  }

  async function getComments(entityId: string): Promise<TComment[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from(commentsTable)
        .select("*")
        .eq(foreignKey, entityId)
        .order("created_at", { ascending: false })

      if (error) throw new Error(error.message)
      return (data || []) as TComment[]
    } catch (err) {
      console.warn("Failed to get comments, returning empty array:", err)
      return []
    }
  }

  return { rate, getRatings, addComment, getComments }
}
