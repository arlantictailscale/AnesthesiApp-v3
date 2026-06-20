import { type MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/login",
        "/signup",
        "/support",
        "/privacy",
        "/terms",
      ],
      disallow: [
        "/dashboard",
        "/profile",
        "/cases",
        "/cbt",
        "/osce",
        "/drugs",
        "/guidelines",
        "/research",
        "/todos",
        "/welcome",
        "/api",
        "/auth",
      ],
    },
    sitemap: "https://anesthesiapp.my.id/sitemap.xml",
  }
}
