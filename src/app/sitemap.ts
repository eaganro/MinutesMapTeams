import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { TEAM_ABBREVIATIONS } from "@/lib/teams";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    ...TEAM_ABBREVIATIONS.map((abbr) => ({
      url: `${siteConfig.url}/teams/${abbr}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
