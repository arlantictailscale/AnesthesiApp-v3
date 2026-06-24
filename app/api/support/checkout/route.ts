import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIPaymuConfig, generateBodyHash, generateIPaymuSignature } from "@/lib/ipaymu"

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

    // Initialize Supabase and lookup current user credentials
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to make a support contribution." }, { status: 401 })
    }

    const userId = user.id
    const email = user.email || "anonymous@anesthesiapp.my.id"

    // iPaymu API Setup
    const ipaymuConfig = getIPaymuConfig()
    if (!ipaymuConfig.va || !ipaymuConfig.apiKey) {
      console.error("iPaymu configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    const requestTarget = "/api/v2/payment"
    const requestUrl = `${ipaymuConfig.baseUrl}${requestTarget}`

    const host = request.headers.get("host") || new URL(request.url).host
    const proto = request.headers.get("x-forwarded-proto") || "https"
    const origin = `${proto}://${host}`
    const callbackUrl = `${origin}/support/success?order_id=${orderId}`

    const ipaymuBody = {
      product: [tier],
      qty: ["1"],
      price: [Math.round(parseFloat(amount))],
      description: [`Supporter Subscription - ${tier}`],
      referenceId: orderId,
      returnUrl: callbackUrl,
      notifyUrl: `${origin}/api/support/webhook`,
      cancelUrl: `${origin}/support?payment=failed`,
      buyerName: name,
      buyerEmail: email,
      buyerPhone: "08123456789",
      expired: "24",
      feeDirection: "MERCHANT",
      lang: "id",
    }

    const bodyString = JSON.stringify(ipaymuBody)
    const bodyHash = generateBodyHash(bodyString)
    
    // Generate YYYYMMDDHHmmss timestamp
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

    console.log("iPaymu request URL:", requestUrl)
    console.log("iPaymu request body:", bodyString)

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
    console.log("iPaymu API status:", response.status)
    console.log("iPaymu API response:", responseText)

    if (!response.ok) {
      return NextResponse.json({ error: `Payment gateway error (${response.status}): ${responseText.substring(0, 200)}` }, { status: 400 })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error("iPaymu returned non-JSON response:", responseText.substring(0, 500))
      return NextResponse.json({ error: "Payment gateway returned invalid response" }, { status: 400 })
    }

    if (data.Status !== 200 || !data.Data?.Url) {
      console.error("iPaymu payment creation failed:", data)
      return NextResponse.json({ error: data.Message || "Payment gateway response invalid" }, { status: 400 })
    }

    const redirectUrl = data.Data.Url

    // Insert pending Supporter in database WITH payment_url
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
        payment_url: redirectUrl,
      })

    if (dbError) {
      console.error("Database error creating supporter:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
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
