import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"

    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured")
      return NextResponse.json({ error: "Payment gateway key misconfigured" }, { status: 500 })
    }

    const baseUrl = isProduction
      ? `https://api.midtrans.com/v2/${order_id}/status`
      : `https://api.sandbox.midtrans.com/v2/${order_id}/status`

    const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`

    const response = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Midtrans status API error:", errorText)
      return NextResponse.json({ error: `Payment gateway error: ${response.statusText}` }, { status: 502 })
    }

    const data = await response.json()
    const transactionStatus = data.transaction_status
    const fraudStatus = data.fraud_status

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

    // Update the database only if state changed
    if (dbStatus !== "pending") {
      const supabase = await createClient()
      const { error: dbError } = await supabase
        .from("supporters")
        .update({ status: dbStatus })
        .eq("order_id", order_id)

      if (dbError) {
        console.error("Database update error:", dbError)
        return NextResponse.json({ error: dbError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      status: dbStatus,
      transaction_status: transactionStatus,
    })

  } catch (err) {
    console.error("Confirm route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
