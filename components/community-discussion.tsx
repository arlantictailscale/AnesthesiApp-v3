"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { CommunityComment, CommunityRatingsSummary } from "@/lib/community"
import { Star, MessageSquare, Send, Calendar, User } from "lucide-react"

export interface CommunityDiscussionProps {
  /** Id of the entity (CBT package, OSCE station, ...) being discussed. */
  entityId: string
  /** Prompt shown to logged-out users above the (disabled) comment box. */
  loginPrompt: string
  rate: (entityId: string, rating: number) => Promise<void>
  getRatings: (entityId: string) => Promise<CommunityRatingsSummary>
  addComment: (entityId: string, comment: string) => Promise<CommunityComment>
  getComments: (entityId: string) => Promise<CommunityComment[]>
}

/**
 * Shared "Community Hub" panel: a star-rating card plus a threaded discussion
 * board. Behaviour is identical across features; the data access functions and a
 * couple of copy strings are injected via props.
 */
export function CommunityDiscussion({
  entityId,
  loginPrompt,
  rate,
  getRatings,
  addComment,
  getComments,
}: CommunityDiscussionProps) {
  const [user, setUser] = useState<any>(null)

  // Ratings state
  const [ratings, setRatings] = useState<CommunityRatingsSummary>({ average: 0, count: 0 })
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)

  // Comments state
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  async function checkUser() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch {
      setUser(null)
    }
  }

  async function loadData() {
    try {
      const [rSummary, cList] = await Promise.all([
        getRatings(entityId),
        getComments(entityId),
      ])
      setRatings(rSummary)
      setComments(cList)
    } catch (err) {
      console.error("Failed to load hub data:", err)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    checkUser()
    loadData()
  }, [entityId])

  async function handleRate(value: number) {
    if (!user) {
      toast.error("Silakan masuk log (login) untuk memberikan rating.")
      return
    }
    setRatingLoading(true)
    try {
      await rate(entityId, value)
      toast.success(`Berhasil memberikan rating ${value} bintang!`)
      await loadData()
    } catch (err) {
      toast.error("Gagal mengirim rating. Pastikan tabel database telah dibuat.")
    } finally {
      setRatingLoading(false)
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Silakan masuk log (login) untuk berkomentar.")
      return
    }
    if (!newComment.trim()) {
      toast.error("Komentar tidak boleh kosong.")
      return
    }

    setCommentLoading(true)
    try {
      await addComment(entityId, newComment.trim())
      toast.success("Komentar berhasil dipublikasikan!")
      setNewComment("")
      await loadData()
    } catch (err) {
      toast.error("Gagal memposting komentar. Pastikan tabel database telah dibuat.")
    } finally {
      setCommentLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <Card className="border border-border bg-card animate-pulse h-48 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Memuat diskusi hub...</span>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Ratings Panel */}
      <Card className="border border-border bg-card shadow-sm flex flex-col h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Rating Komunitas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-foreground">{ratings.average}</span>
            <div className="flex items-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= ratings.average ? "text-yellow-500 fill-yellow-500" : "text-muted border-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground mt-1.5">
              {ratings.count} ulasan
            </span>
          </div>
        </CardContent>

        <CardFooter className="w-full border-t border-border pt-4 flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground block mb-2">
            {ratings.userRating ? "Rating Anda" : "Berikan Rating Anda"}
          </span>

          {user ? (
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverRating ?? ratings.userRating ?? 0)
                return (
                  <button
                    key={star}
                    disabled={ratingLoading}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform active:scale-95 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-all ${isActive ? "text-yellow-500 fill-yellow-500 scale-110" : "text-muted-foreground/30 hover:text-yellow-500"}`}
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Masuk log untuk memberi ulasan.
            </span>
          )}
        </CardFooter>
      </Card>

      {/* Discussion Board */}
      <Card className="border border-border bg-card shadow-sm md:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            Diskusi & Tanya Jawab
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Post Comment Input */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <Textarea
                placeholder="Tanyakan materi, diskusikan soal, atau beri masukan kepada penulis..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commentLoading}
                className="h-20 text-sm"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={commentLoading} className="gap-1.5">
                  {commentLoading ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Kirim Komentar
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-muted/30 border border-border rounded-lg text-center text-xs text-muted-foreground">
              {loginPrompt}
            </div>
          )}

          {/* Comments List */}
          <div className="border-t border-border pt-4 space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6 italic">
                Belum ada komentar. Jadilah yang pertama memulai diskusi!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 text-sm items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 bg-muted/20 border border-border/50 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {c.user_email}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                      {c.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
