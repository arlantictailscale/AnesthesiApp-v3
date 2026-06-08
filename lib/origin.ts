/**
 * Dynamically resolves the request origin by checking standard proxy headers.
 * This is crucial when the app is hosted behind a reverse proxy (like Cloudflare),
 * which forwards requests to a local port (e.g. localhost:3000) but uses a public HTTPS domain.
 */
export function getRequestOrigin(request: Request): string {
  const headers = request.headers
  const protoHeader = headers.get("x-forwarded-proto") || "http"
  const proto = protoHeader.split(",")[0].trim()

  const hostHeader = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000"
  const host = hostHeader.split(",")[0].trim()

  return `${proto}://${host}`
}
