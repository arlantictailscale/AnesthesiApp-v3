import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIPaymuConfig, generateBodyHash, generateIPaymuSignature } from "@/lib/ipaymu"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: supporter, error: fetchError } = await supabase
      .from("supporters")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle()

    if (fetchError || !supporter) {
      console.error("Supporter record not found:", fetchError)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (!supporter.payment_url) {
      console.error("Supporter payment URL is missing")
      return NextResponse.json({ error: "Payment URL is missing" }, { status: 400 })
    }

    const sessionId = supporter.payment_url.split("/").pop()
    if (!sessionId) {
      console.error("Could not parse Session ID from payment URL:", supporter.payment_url)
      return NextResponse.json({ error: "Invalid payment session" }, { status: 400 })
    }

    const ipaymuConfig = getIPaymuConfig()
    if (!ipaymuConfig.va || !ipaymuConfig.apiKey) {
      console.error("iPaymu configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const requestTarget = "/api/v2/transaction"
    const requestUrl = `${ipaymuConfig.baseUrl}${requestTarget}`

    const ipaymuBody = {
      transactionId: sessionId,
      account: ipaymuConfig.va,
    }

    const bodyString = JSON.stringify(ipaymuBody)
    const bodyHash = generateBodyHash(bodyString)

    const now = new Date()
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("")

    const signature = generateIPaymuSignature("POST", ipaymuConfig.va, bodyHash, ipaymuConfig.apiKey)

    console.log("iPaymu Check Status request URL:", requestUrl)
    console.log("iPaymu Check Status request body:", bodyString)

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "va": ipaymuConfig.va,
        "signature": signature,
        "timestamp": timestamp,
      },
      body: bodyString,
    })

    const responseText = await response.text()
    console.log("iPaymu Check Status API status:", response.status)
    console.log("iPaymu Check Status API response:", responseText)

    if (!response.ok) {
      return NextResponse.json({ error: `Payment gateway error (${response.status}): ${responseText.substring(0, 200)}` }, { status: 400 })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error("iPaymu Check Status returned non-JSON response:", responseText.substring(0, 500))
      return NextResponse.json({ error: "Payment gateway returned invalid response" }, { status: 400 })
    }

    if (data.Status !== 200 || !data.Data) {
      console.error("iPaymu transaction check failed:", data)
      return NextResponse.json({ error: data.Message || "Payment gateway check failed" }, { status: 400 })
    }

    const paidStatus = data.Data.PaidStatus // e.g. "paid", "unpaid"
    const transactionStatus = Number(data.Data.Status) // e.g. 1 (success), 0 (pending), 2 (failed/cancelled)

    let dbStatus: "pending" | "paid" | "failed" = "pending"

    if (paidStatus === "paid" || [1, 6, 7].includes(transactionStatus)) {
      dbStatus = "paid"
    } else if (paidStatus === "expired" || paidStatus === "failed" || [2].includes(transactionStatus)) {
      dbStatus = "failed"
    } else {
      dbStatus = "pending"
    }

    // Update the database only if state changed
    if (dbStatus !== supporter.status) {
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
      transaction_status: paidStatus || data.Data.StatusDesc || "unknown",
    })

  } catch (err) {
    console.error("Confirm route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
