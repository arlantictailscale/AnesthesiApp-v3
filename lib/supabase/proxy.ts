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

  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if they need 2FA
  let needs2FA = false
  if (user) {
    const { data: { session } } = await supabase.auth.getSession()
    const amrMethods = session ? getAmrFromToken(session.access_token) : []
    const isRecovery = amrMethods.includes("recovery")

    if (!isRecovery) {
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aalError && aalData) {
        needs2FA = aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2"
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

function getAmrFromToken(token: string): string[] {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return []
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const payload = JSON.parse(jsonPayload)
    const amr = payload.amr
    if (Array.isArray(amr)) {
      return amr.map((item: any) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && typeof item.method === "string") {
          return item.method
        }
        return ""
      }).filter(Boolean)
    }
  } catch (e) {
    console.error("Error decoding token AMR:", e)
  }
  return []
}
