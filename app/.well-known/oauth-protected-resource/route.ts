import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://shqthvtlwqkshccetgcz.supabase.co"
  const issuer = `${supabaseUrl}/auth/v1`

  const resourceMetadata = {
    resource: `${origin}/`,
    authorization_servers: [origin],
    scopes_supported: ["anon", "authenticated"],
    bearer_methods_supported: ["header"]
  }

  return NextResponse.json(resourceMetadata, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
