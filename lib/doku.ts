import { createHash, createHmac } from "crypto"

export interface DokuConfig {
  clientId: string
  secretKey: string
  isProduction: boolean
  baseUrl: string
}

export function getDokuConfig(): DokuConfig {
  const clientId = process.env.DOKU_CLIENT_ID || ""
  const secretKey = process.env.DOKU_SECRET_KEY || ""
  const isProduction = process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION === "true"
  const baseUrl = isProduction
    ? "https://api.doku.com"
    : "https://api-sandbox.doku.com"

  return {
    clientId,
    secretKey,
    isProduction,
    baseUrl,
  }
}

/**
 * Generates the SHA-256 digest of the request body, encoded in Base64.
 */
export function generateDigest(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("base64")
}

interface GenerateSignatureParams {
  clientId: string
  requestId: string
  timestamp: string
  target: string
  digest: string
  secretKey: string
}

/**
 * Generates the DOKU HMAC-SHA256 signature prefixed with 'HMACSHA256='.
 */
export function generateSignature({
  clientId,
  requestId,
  timestamp,
  target,
  digest,
  secretKey,
}: GenerateSignatureParams): string {
  let rawString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}`
  if (digest) {
    rawString += `\nDigest:${digest}`
  }
  const hmac = createHmac("sha256", secretKey)
  hmac.update(rawString, "utf8")
  return `HMACSHA256=${hmac.digest("base64")}`
}
