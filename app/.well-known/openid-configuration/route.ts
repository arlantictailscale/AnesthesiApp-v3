import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://shqthvtlwqkshccetgcz.supabase.co"
  const issuer = origin
  const supabaseAuthUrl = `${supabaseUrl}/auth/v1`

  const config = {
    issuer,
    authorization_endpoint: `${supabaseAuthUrl}/authorize`,
    token_endpoint: `${supabaseAuthUrl}/token`,
    jwks_uri: `${supabaseAuthUrl}/jwks`,
    grant_types_supported: ["authorization_code", "implicit", "refresh_token"],
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"]
  }

  return NextResponse.json(config, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
