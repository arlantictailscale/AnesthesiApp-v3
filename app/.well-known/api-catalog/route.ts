import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const linkset = {
    linkset: [
      {
        anchor: `${origin}/`,
        rel: "api-catalog",
        href: `${origin}/.well-known/api-catalog`,
        type: "application/linkset+json"
      },
      {
        anchor: `${origin}/api/ai/populate`,
        rel: "service-desc",
        href: `${origin}/api/docs/openapi.json`,
        type: "application/openapi+json;version=3.0"
      },
      {
        anchor: `${origin}/api/ai/populate`,
        rel: "service-doc",
        href: `${origin}/auth.md`
      }
    ]
  }

  return new NextResponse(JSON.stringify(linkset), {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
