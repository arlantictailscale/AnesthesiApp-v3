import { type MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/login",
        "/signup",
        "/privacy",
        "/terms",
        "/drugs",
        "/guidelines",
        "/research",
        "/cbt",
        "/osce",
      ],
      disallow: [
        "/dashboard",
        "/profile",
        "/cases/",
        "/cbt/exam/",
        "/cbt/results/",
        "/osce/practice/",
        "/todos",
        "/welcome",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: "https://anesthesiapp.my.id/sitemap.xml",
  }
}
