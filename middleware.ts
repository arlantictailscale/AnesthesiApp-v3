import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Check for Accept: text/markdown content negotiation
  const acceptHeader = request.headers.get("accept") || ""
  const { pathname } = request.nextUrl
  
  if (
    acceptHeader.includes("text/markdown") &&
    !pathname.startsWith("/.well-known") &&
    !pathname.startsWith("/api") &&
    !pathname.endsWith(".md")
  ) {
    let markdownContent = ""

    if (pathname === "/") {
      markdownContent = `# AnesthesiApp\n\nA mobile-first anesthesia case logging platform for clinical documentation, medical research, and national board CBT & OSCE exam preparation.\n\n## Agent Resources\n- [API Catalog](/.well-known/api-catalog) - Discover available APIs\n- [OAuth Authorization Server](/.well-known/oauth-authorization-server) - Learn how to authenticate\n- [OAuth Protected Resource Metadata](/.well-known/oauth-protected-resource) - Find required scopes\n- [Agent Skills discovery index](/.well-known/agent-skills/index.json) - Learn about agent skills supported by this site\n- [MCP Server Card](/.well-known/mcp/server-card.json) - Connect as an MCP client\n- [Registration instructions](/auth.md) - Learn how to register credentials`
    } else {
      markdownContent = `# AnesthesiApp - Route: ${pathname}\n\nThis page is part of the AnesthesiApp application.\n- To view cases and log cases, please visit [Dashboard](/dashboard) or log in at [Login](/login).\n- Find automated discovery metadata in our [API Catalog](/.well-known/api-catalog).`
    }

    return new NextResponse(markdownContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(markdownContent.split(/\s+/).length),
      },
    })
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
