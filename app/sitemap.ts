import { type MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://anesthesiapp.my.id"

  const routes = [
    { url: "", changeRequirement: "daily", priority: 1.0 },
    { url: "/login", changeRequirement: "monthly", priority: 0.8 },
    { url: "/signup", changeRequirement: "monthly", priority: 0.8 },
    { url: "/drugs", changeRequirement: "weekly", priority: 0.8 },
    { url: "/guidelines", changeRequirement: "weekly", priority: 0.8 },
    { url: "/research", changeRequirement: "daily", priority: 0.8 },
    { url: "/cbt", changeRequirement: "weekly", priority: 0.7 },
    { url: "/osce", changeRequirement: "weekly", priority: 0.7 },
    { url: "/privacy", changeRequirement: "yearly", priority: 0.3 },
    { url: "/terms", changeRequirement: "yearly", priority: 0.3 },
  ]

  return routes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: new Date(),
    changeFrequency: r.changeRequirement as any,
    priority: r.priority,
  }))
}
