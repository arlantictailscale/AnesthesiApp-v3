import { type MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://anesthesiapp.my.id"

  const routes = [
    { url: "", changeFrequency: "daily", priority: 1.0 },
    { url: "/login", changeFrequency: "monthly", priority: 0.8 },
    { url: "/signup", changeFrequency: "monthly", priority: 0.8 },
    { url: "/support", changeFrequency: "monthly", priority: 0.8 },
    { url: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { url: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ]

  return routes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency as any,
    priority: r.priority,
  }))
}
