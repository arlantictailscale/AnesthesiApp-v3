import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createHash, createHmac } from "node:crypto"
import {
  getIPaymuConfig,
  generateBodyHash,
  generateIPaymuSignature,
} from "./ipaymu"

describe("getIPaymuConfig", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.IPAYMU_VA
    delete process.env.IPAYMU_API_KEY
    delete process.env.NEXT_PUBLIC_IPAYMU_IS_PRODUCTION
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("returns sandbox defaults when nothing is configured", () => {
    const config = getIPaymuConfig()
    expect(config).toEqual({
      va: "",
      apiKey: "",
      isProduction: false,
      baseUrl: "https://sandbox.ipaymu.com",
    })
  })

  it("reads va and apiKey from environment variables", () => {
    process.env.IPAYMU_VA = "1234567890"
    process.env.IPAYMU_API_KEY = "secret-key"
    const config = getIPaymuConfig()
    expect(config.va).toBe("1234567890")
    expect(config.apiKey).toBe("secret-key")
  })

  it("uses the production base url when the flag is exactly 'true'", () => {
    process.env.NEXT_PUBLIC_IPAYMU_IS_PRODUCTION = "true"
    const config = getIPaymuConfig()
    expect(config.isProduction).toBe(true)
    expect(config.baseUrl).toBe("https://my.ipaymu.com")
  })

  it("treats any non-'true' value as sandbox", () => {
    process.env.NEXT_PUBLIC_IPAYMU_IS_PRODUCTION = "TRUE"
    const config = getIPaymuConfig()
    expect(config.isProduction).toBe(false)
    expect(config.baseUrl).toBe("https://sandbox.ipaymu.com")
  })
})

describe("generateBodyHash", () => {
  it("produces a lowercase hex sha256 digest of the body", () => {
    const body = JSON.stringify({ amount: 1000, product: "test" })
    const expected = createHash("sha256").update(body, "utf8").digest("hex")
    expect(generateBodyHash(body)).toBe(expected)
  })

  it("is deterministic for the same input", () => {
    const body = '{"a":1}'
    expect(generateBodyHash(body)).toBe(generateBodyHash(body))
  })

  it("produces different hashes for different bodies", () => {
    expect(generateBodyHash('{"a":1}')).not.toBe(generateBodyHash('{"a":2}'))
  })
})

describe("generateIPaymuSignature", () => {
  it("builds an HMAC-SHA256 over METHOD:VA:BODY_HASH:APIKEY", () => {
    const method = "post"
    const va = "0000001234567890"
    const bodyHash = generateBodyHash('{"amount":1000}')
    const apiKey = "my-api-key"

    const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`
    const expected = createHmac("sha256", apiKey)
      .update(stringToSign, "utf8")
      .digest("hex")

    expect(generateIPaymuSignature(method, va, bodyHash, apiKey)).toBe(expected)
  })

  it("uppercases the HTTP method before signing", () => {
    const va = "va"
    const bodyHash = "hash"
    const apiKey = "key"
    expect(generateIPaymuSignature("get", va, bodyHash, apiKey)).toBe(
      generateIPaymuSignature("GET", va, bodyHash, apiKey),
    )
  })

  it("produces different signatures for different api keys", () => {
    const sigA = generateIPaymuSignature("POST", "va", "hash", "keyA")
    const sigB = generateIPaymuSignature("POST", "va", "hash", "keyB")
    expect(sigA).not.toBe(sigB)
  })
})
