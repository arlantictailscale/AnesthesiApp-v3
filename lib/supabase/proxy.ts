import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Check if there is an auth cookie first to bypass network calls for guest users
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes("-auth-token"))

  let user = null
  if (hasAuthCookie) {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  const { pathname } = request.nextUrl

  // Check if they need 2FA
  let needs2FA = false
  if (user) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const tokenPayload = getPayloadFromToken(session.access_token)
      if (tokenPayload) {
        const amrMethods = tokenPayload.amr ? parseAmr(tokenPayload.amr) : []
        const isRecovery = amrMethods.includes("recovery")

        if (!isRecovery) {
          // Check if MFA is enabled in user_metadata, and session is AAL1
          const isMfaEnrolled = tokenPayload.user_metadata?.mfa_enrolled === true
          const currentAal = tokenPayload.aal || "aal1"
          needs2FA = isMfaEnrolled && currentAal === "aal1"
        }
      }
    }
  }

  // Redirect to MFA verification if they need 2FA
  if (needs2FA) {
    const isProtectedOrAuth =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/cases") ||
      pathname.startsWith("/cbt") ||
      pathname.startsWith("/osce") ||
      pathname.startsWith("/drugs") ||
      pathname.startsWith("/guidelines") ||
      pathname.startsWith("/research") ||
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/"

    if (isProtectedOrAuth && pathname !== "/login/mfa") {
      const url = request.nextUrl.clone()
      url.pathname = "/login/mfa"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Redirect successful auth redirects to /dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cases") ||
    pathname.startsWith("/cbt") ||
    pathname.startsWith("/osce") ||
    pathname.startsWith("/drugs") ||
    pathname.startsWith("/guidelines") ||
    pathname.startsWith("/research")

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

function getPayloadFromToken(token: string): any {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error("Error decoding token payload:", e)
    return null
  }
}

function parseAmr(amr: any): string[] {
  if (Array.isArray(amr)) {
    return amr.map((item: any) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && typeof item.method === "string") {
        return item.method
      }
      return ""
    }).filter(Boolean)
  }
  return []
}
