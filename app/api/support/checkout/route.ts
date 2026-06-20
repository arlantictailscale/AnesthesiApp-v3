import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDokuConfig, generateDigest, generateSignature } from "@/lib/doku"

export const runtime = "nodejs"

const TIER_AMOUNTS: Record<string, number> = {
  "Backer": 50000,
  "Sponsor": 150000,
  "Gold Sponsor": 500000,
  "Platinum Sponsor": 1000000,
  "Diamond Sponsor": 2500000
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, tier, amount, message, website } = body
    const type = "individual"

    if (!name || !tier) {
      return NextResponse.json({ error: "Missing name or tier" }, { status: 400 })
    }

    const expectedAmount = TIER_AMOUNTS[tier]
    if (!expectedAmount || Math.round(parseFloat(amount)) !== expectedAmount) {
      return NextResponse.json({ error: "Invalid tier or tampered amount" }, { status: 400 })
    }

    const orderId = `SUPPORT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    // Insert pending Supporter in database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null
    const email = user?.email || "anonymous@anesthesiapp.my.id"

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
        user_id: userId,
      })

    if (dbError) {
      console.error("Database error creating supporter:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // DOKU API Setup
    const dokuConfig = getDokuConfig()
    if (!dokuConfig.clientId || !dokuConfig.secretKey) {
      console.error("DOKU configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const requestTarget = "/checkout/v1/payment"
    const requestUrl = `${dokuConfig.baseUrl}${requestTarget}`

    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/support/success?order_id=${orderId}`

    const dokuBody = {
      order: {
        amount: Math.round(parseFloat(amount)),
        invoice_number: orderId,
        callback_url: callbackUrl,
      },
      customer: {
        name,
        email,
      },
    }

    const bodyString = JSON.stringify(dokuBody)
    const digest = generateDigest(bodyString)
    
    const requestId = crypto.randomUUID()
    const timestamp = new Date().toISOString().split(".")[0] + "Z" // format YYYY-MM-DDTHH:mm:ssZ

    const signature = generateSignature({
      clientId: dokuConfig.clientId,
      requestId,
      timestamp,
      target: requestTarget,
      digest,
      secretKey: dokuConfig.secretKey,
    })

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": dokuConfig.clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        "Signature": signature,
      },
      body: bodyString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("DOKU API error:", errorText)
      return NextResponse.json({ error: `Payment gateway error: ${response.statusText}` }, { status: 502 })
    }

    const data = await response.json()
    const redirectUrl = data.response?.payment?.url

    if (!redirectUrl) {
      console.error("DOKU response missing payment URL:", data)
      return NextResponse.json({ error: "Payment gateway response invalid" }, { status: 502 })
    }

    return NextResponse.json({
      redirect_url: redirectUrl,
      order_id: orderId,
    })

  } catch (err) {
    console.error("Checkout route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
