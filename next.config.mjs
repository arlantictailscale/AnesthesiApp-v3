/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: '</.well-known/api-catalog>; rel="api-catalog", </.well-known/agent-skills/index.json>; rel="agent-skills", </auth.md>; rel="service-doc"'
          }
        ]
      }
    ]
  }
}

export default nextConfig
