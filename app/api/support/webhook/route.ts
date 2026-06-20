import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDokuConfig, generateDigest, generateSignature } from "@/lib/doku"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (parseErr) {
      console.error("Failed to parse webhook JSON body:", parseErr)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const headers = request.headers
    const clientIdHeader = headers.get("client-id")
    const requestIdHeader = headers.get("request-id")
    const timestampHeader = headers.get("request-timestamp")
    const signatureHeader = headers.get("signature") || headers.get("x-signature")

    if (!clientIdHeader || !requestIdHeader || !timestampHeader || !signatureHeader) {
      console.warn("[Webhook Validation Failed] Missing required security headers")
      return NextResponse.json({ error: "Missing required security headers" }, { status: 400 })
    }

    const dokuConfig = getDokuConfig()
    if (!dokuConfig.clientId || !dokuConfig.secretKey) {
      console.error("DOKU configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    // Verify signature to prevent fraud:
    const digest = generateDigest(rawBody)
    const requestTarget = new URL(request.url).pathname

    const computedSignature = generateSignature({
      clientId: clientIdHeader,
      requestId: requestIdHeader,
      timestamp: timestampHeader,
      target: requestTarget,
      digest,
      secretKey: dokuConfig.secretKey,
    })

    if (computedSignature !== signatureHeader) {
      console.warn(`[Webhook Validation Failed] Computed: ${computedSignature}, Received: ${signatureHeader}`)
      return NextResponse.json({ error: "Invalid signature key" }, { status: 403 })
    }

    const order_id = body.transaction?.invoice_number
    const transactionStatus = body.transaction?.status

    if (!order_id || !transactionStatus) {
      return NextResponse.json({ error: "Missing required notification fields" }, { status: 400 })
    }

    let dbStatus: "pending" | "paid" | "failed" = "pending"

    if (transactionStatus === "SUCCESS") {
      dbStatus = "paid"
    } else if (transactionStatus === "FAILED") {
      dbStatus = "failed"
    } else if (transactionStatus === "PENDING") {
      dbStatus = "pending"
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
