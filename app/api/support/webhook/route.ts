import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Missing required notification fields" }, { status: 400 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured")
      return NextResponse.json({ error: "Payment gateway key misconfigured" }, { status: 500 })
    }

    // Verify signature to prevent fraud:
    // SHA512(order_id + status_code + gross_amount + server_key)
    const computedSignature = createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex")

    if (computedSignature !== signature_key) {
      console.warn(`[Webhook Validation Failed] Computed: ${computedSignature}, Received: ${signature_key}`)
      return NextResponse.json({ error: "Invalid signature key" }, { status: 403 })
    }

    let dbStatus: "pending" | "paid" | "failed" = "pending"

    if (
      transactionStatus === "capture" && fraudStatus === "accept" ||
      transactionStatus === "settlement"
    ) {
      dbStatus = "paid"
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      dbStatus = "failed"
    }

    // If state changed, update database record
    if (dbStatus !== "pending") {
      const supabase = await createClient()
      const { data: updatedSupporters, error: dbError } = await supabase
        .from("supporters")
        .update({ status: dbStatus })
        .eq("order_id", order_id)
        .select("user_id, tier")

      if (dbError) {
        console.error("Database update error on webhook:", dbError)
        return NextResponse.json({ error: dbError.message }, { status: 500 })
      }

      // If payment is settled, set user's supporter tier badge
      if (dbStatus === "paid" && updatedSupporters && updatedSupporters.length > 0) {
        const { user_id, tier } = updatedSupporters[0]
        if (user_id) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ supporter_tier: tier.toLowerCase() })
            .eq("id", user_id)
          
          if (profileError) {
            console.error("Failed to update profile supporter tier on webhook:", profileError)
          }
        }
      }
      console.log(`[Support Webhook] Updated order ${order_id} to ${dbStatus}`)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("Webhook route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
