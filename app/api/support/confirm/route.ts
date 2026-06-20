import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDokuConfig, generateSignature } from "@/lib/doku"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const dokuConfig = getDokuConfig()
    if (!dokuConfig.clientId || !dokuConfig.secretKey) {
      console.error("DOKU configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const requestTarget = `/checkout/v1/payment/check-status/${order_id}`
    const requestUrl = `${dokuConfig.baseUrl}${requestTarget}`

    const requestId = crypto.randomUUID()
    const timestamp = new Date().toISOString().split(".")[0] + "Z" // format YYYY-MM-DDTHH:mm:ssZ

    // For GET request, digest is empty string
    const signature = generateSignature({
      clientId: dokuConfig.clientId,
      requestId,
      timestamp,
      target: requestTarget,
      digest: "",
      secretKey: dokuConfig.secretKey,
    })

    console.log("DOKU Status check URL:", requestUrl)
    console.log("DOKU Status check headers:", {
      "Client-Id": dokuConfig.clientId,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      "Signature": signature,
    })

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Client-Id": dokuConfig.clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        "Signature": signature,
      },
    })

    const responseText = await response.text()
    console.log("DOKU Status API status:", response.status)
    console.log("DOKU Status API response:", responseText)

    if (!response.ok) {
      return NextResponse.json({ error: `Payment gateway error (${response.status}): ${responseText.substring(0, 200)}` }, { status: 502 })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error("DOKU Status API returned non-JSON response:", responseText.substring(0, 500))
      return NextResponse.json({ error: "Payment gateway returned invalid response" }, { status: 502 })
    }
    const orderStatus = data.order?.status
    const transactionStatus = data.transaction?.status

    let dbStatus: "pending" | "paid" | "failed" = "pending"

    if (transactionStatus === "SUCCESS") {
      dbStatus = "paid"
    } else if (transactionStatus === "FAILED" || orderStatus === "ORDER_EXPIRED") {
      dbStatus = "failed"
    } else if (transactionStatus === "PENDING" || orderStatus === "ORDER_GENERATED") {
      dbStatus = "pending"
    }

    // Update the database only if state changed
    if (dbStatus !== "pending") {
      const supabase = await createClient()
      const { data: updatedSupporters, error: dbError } = await supabase
        .from("supporters")
        .update({ status: dbStatus })
        .eq("order_id", order_id)
        .select("user_id, tier")

      if (dbError) {
        console.error("Database update error:", dbError)
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
            console.error("Failed to update profile supporter tier:", profileError)
          }
        }
      }
    }

    return NextResponse.json({
      status: dbStatus,
      transaction_status: transactionStatus || orderStatus || "unknown",
    })

  } catch (err) {
    console.error("Confirm route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
