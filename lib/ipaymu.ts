import { createHash, createHmac } from "crypto"

export interface IPaymuConfig {
  va: string
  apiKey: string
  isProduction: boolean
  baseUrl: string
}

export function getIPaymuConfig(): IPaymuConfig {
  const va = process.env.IPAYMU_VA || ""
  const apiKey = process.env.IPAYMU_API_KEY || ""
  const isProduction = process.env.NEXT_PUBLIC_IPAYMU_IS_PRODUCTION === "true"
  const baseUrl = isProduction
    ? "https://my.ipaymu.com"
    : "https://sandbox.ipaymu.com"

  return {
    va,
    apiKey,
    isProduction,
    baseUrl,
  }
}

/**
 * Generates the SHA-256 hash of the request body in hex format.
 */
export function generateBodyHash(bodyJson: string): string {
  return createHash("sha256").update(bodyJson, "utf8").digest("hex")
}

/**
 * Generates the iPaymu signature using HMAC-SHA256.
 * Format: METHOD:VA:BODY_HASH:APIKEY
 */
export function generateIPaymuSignature(
  method: string,
  va: string,
  bodyHash: string,
  apiKey: string
): string {
  const stringToSign = `${method.toUpperCase()}:${va}:${bodyHash}:${apiKey}`
  return createHmac("sha256", apiKey).update(stringToSign, "utf8").digest("hex")
}
