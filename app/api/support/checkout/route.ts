import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, tier, amount, message, website } = body

    if (!name || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Invalid name or amount" }, { status: 400 })
    }

    const orderId = `SUPPORT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    // Insert pending Supporter in database
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from("supporters")
      .insert({
        name,
        type,
        tier,
        amount: parseFloat(amount),
        message: message || null,
        website: website || null,
        status: "pending",
        order_id: orderId,
      })

    if (dbError) {
      console.error("Database error creating supporter:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Midtrans API Setup
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured")
      return NextResponse.json({ error: "Payment gateway key misconfigured" }, { status: 500 })
    }

    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions"

    const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`

    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(parseFloat(amount)),
      },
      customer_details: {
        first_name: name,
      },
      credit_card: {
        secure: true,
      },
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(midtransBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Midtrans API error:", errorText)
      return NextResponse.json({ error: `Payment gateway error: ${response.statusText}` }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId,
    })

  } catch (err) {
    console.error("Checkout route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
