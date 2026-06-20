import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Helper function to check if the current user is an admin
async function checkAdminStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return { 
    userId: user.id, 
    email: user.email, 
    isAdmin: profile?.role === "admin" 
  }
}

// GET all user profiles (admin only)
export async function GET() {
  try {
    const { isAdmin } = await checkAdminStatus()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("email", { ascending: true })

    if (usersError) {
      console.error("Failed to list users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("supporters")
      .select(`
        *,
        profiles:user_id (email)
      `)
      .order("created_at", { ascending: false })

    if (paymentsError) {
      console.error("Failed to list payments:", paymentsError)
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }

    return NextResponse.json({ users, payments })
  } catch (err: any) {
    console.error("API error in GET users:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

// PUT to update a user's role or supporter tier (admin only)
export async function PUT(req: Request) {
  try {
    const { userId: currentUserId, isAdmin } = await checkAdminStatus()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { targetUserId, role, supporter_tier } = body

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 })
    }

    // Safety check: Prevent self-demotion
    if (targetUserId === currentUserId && role && role !== "admin") {
      return NextResponse.json(
        { error: "Self-demotion is not allowed. You cannot remove your own admin privileges." },
        { status: 400 }
      )
    }

    const updates: Record<string, any> = {}
    if (role !== undefined) updates.role = role
    if (supporter_tier !== undefined) updates.supporter_tier = supporter_tier

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId)
      .select("*")
      .single()

    if (error) {
      console.error("Failed to update user profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: updated })
  } catch (err: any) {
    console.error("API error in PUT user:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
