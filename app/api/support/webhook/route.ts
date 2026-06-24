import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIPaymuConfig } from "@/lib/ipaymu"
import crypto from "crypto"

export const runtime = "nodejs"

async function checkIPaymuStatus(sessionId: string, ipaymuConfig: any) {
  try {
    const requestTarget = "/api/v2/transaction"
    const requestUrl = `${ipaymuConfig.baseUrl}${requestTarget}`
    const ipaymuBody = {
      transactionId: sessionId,
      account: ipaymuConfig.va,
    }
    const bodyString = JSON.stringify(ipaymuBody)
    const bodyHash = crypto.createHash("sha256").update(bodyString, "utf8").digest("hex")
    
    const now = new Date()
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("")
    
    const signature = crypto.createHmac("sha256", ipaymuConfig.apiKey)
      .update(`POST:${ipaymuConfig.va}:${bodyHash}:${ipaymuConfig.apiKey}`, "utf8")
      .digest("hex")

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

    if (!response.ok) return null
    const text = await response.text()
    const data = JSON.parse(text)
    if (data.Status === 200) return data.Data
  } catch (err) {
    console.error("Error double-checking transaction status:", err)
  }
  return null
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    
    const headers = request.headers
    const signatureHeader = headers.get("x-signature") || headers.get("signature")

    const ipaymuConfig = getIPaymuConfig()
    if (!ipaymuConfig.va || !ipaymuConfig.apiKey) {
      console.error("iPaymu configuration is missing keys")
      return NextResponse.json({ error: "Payment gateway configuration error" }, { status: 500 })
    }

    // Verify signature:
    let isSignatureValid = false
    if (signatureHeader) {
      const computedSignature = crypto
        .createHmac("sha256", ipaymuConfig.apiKey)
        .update(rawBody, "utf8")
        .digest("hex")

      if (computedSignature === signatureHeader) {
        isSignatureValid = true
      } else {
        console.warn(`[Support Webhook] Signature mismatch. Received: ${signatureHeader}, Computed: ${computedSignature}`)
      }
    }

    // Parse URL-encoded body
    const params = new URLSearchParams(rawBody)
    const order_id = params.get("reference_id")
    const trx_id = params.get("trx_id")
    const sid = params.get("sid")
    const status = params.get("status")
    const statusCodeStr = params.get("status_code")

    if (!order_id) {
      return NextResponse.json({ error: "Missing required reference_id field" }, { status: 400 })
    }

    let isSuccess = false
    let isFailed = false

    if (isSignatureValid) {
      // Signature is valid, we can trust the callback body directly
      if (statusCodeStr === "1" || status === "berhasil") {
        isSuccess = true
      } else if (statusCodeStr === "-2" || status === "gagal" || status === "expired") {
        isFailed = true
      }
    } else {
      // If signature validation fails, perform a fallback direct transaction status check
      if (sid) {
        console.log(`[Support Webhook] Webhook signature verification failed. Verifying with iPaymu API directly...`)
        const transactionData = await checkIPaymuStatus(sid, ipaymuConfig)
        if (transactionData) {
          const paidStatus = transactionData.PaidStatus // e.g. "paid", "unpaid"
          const transactionStatus = Number(transactionData.Status) // e.g. 1 (success), 2 (failed)
          
          if (paidStatus === "paid" || [1, 6, 7].includes(transactionStatus)) {
            isSuccess = true
            console.log(`[Support Webhook] Direct API verification success: Transaction ${sid} is paid.`)
          } else if (paidStatus === "expired" || paidStatus === "failed" || [2].includes(transactionStatus)) {
            isFailed = true
            console.log(`[Support Webhook] Direct API verification failure: Transaction ${sid} is failed.`)
          }
        }
      }
    }

    if (!isSuccess && !isFailed) {
      // If signature is invalid and we couldn't confirm status, reject request
      if (!isSignatureValid) {
        return NextResponse.json({ error: "Invalid signature key and verification failed" }, { status: 403 })
      }
      // If signature is valid but transaction is pending, return success (do not update status)
      return NextResponse.json({ success: true, status: "pending" })
    }

    const dbStatus = isSuccess ? "paid" : "failed"

    const supabase = await createClient()
    
    // Get current supporter status
    const { data: currentSupporter, error: findError } = await supabase
      .from("supporters")
      .select("status")
      .eq("order_id", order_id)
      .maybeSingle()

    if (findError) {
      console.error("Database find error on webhook:", findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    // Only update if status is changing
    if (currentSupporter && currentSupporter.status !== dbStatus) {
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
