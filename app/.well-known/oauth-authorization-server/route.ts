import { NextResponse } from "next/server"
import { getRequestOrigin } from "@/lib/origin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://shqthvtlwqkshccetgcz.supabase.co"
  const issuer = origin
  const supabaseAuthUrl = `${supabaseUrl}/auth/v1`

  const serverMetadata = {
    issuer,
    authorization_endpoint: `${supabaseAuthUrl}/authorize`,
    token_endpoint: `${supabaseAuthUrl}/token`,
    jwks_uri: `${supabaseAuthUrl}/jwks`,
    grant_types_supported: ["authorization_code", "implicit", "refresh_token"],
    response_types_supported: ["code", "token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    agent_auth: {
      skill: `${origin}/auth.md`,
      register_uri: `${origin}/signup`,
      identity_types_supported: ["anonymous"],
      anonymous: {
        credential_types_supported: ["api_key"]
      },
      claim_uri: `${origin}/signup`
    }
  }

  return NextResponse.json(serverMetadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
