import type { MetadataRoute } from "next";
import { meditationTopics } from "@/data/seo/meditationTopics";
import { breathingTopics } from "@/data/seo/breathingTopics";
import { horoscopeTopics } from "@/data/seo/horoscopeTopics";
import { hybridTopics } from "@/data/seo/hybridTopics";
import { wellnessTopics } from "@/data/seo/wellnessTopics";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";

  const staticUrls: MetadataRoute.Sitemap = [
    "",
    "/calm",
    "/horoscope",
    "/pricing",
    "/dashboard",
    "/journal",
    "/progress",
    "/settings/account",
    "/settings/notifications",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
  }));

  const meditationUrls: MetadataRoute.Sitemap = meditationTopics.map((topic) => ({
    url: `${baseUrl}/meditation/${topic.slug}`,
  }));

  const breathingUrls: MetadataRoute.Sitemap = breathingTopics.map((topic) => ({
    url: `${baseUrl}/breathing/${topic.slug}`,
  }));

  const horoscopeUrls: MetadataRoute.Sitemap = horoscopeTopics.map((topic) => ({
    url: `${baseUrl}/horoscope/${topic.zodiacSign}/${topic.timeRange}`,
  }));

  const hybridUrls: MetadataRoute.Sitemap = hybridTopics.map((topic) => ({
    url: `${baseUrl}/zodiac/${topic.slug}`,
  }));

  const wellnessUrls: MetadataRoute.Sitemap = wellnessTopics.map((topic) => ({
    url: `${baseUrl}/wellness/${topic.slug}`,
  }));

  return [
    ...staticUrls,
    ...meditationUrls,
    ...breathingUrls,
    ...horoscopeUrls,
    ...hybridUrls,
    ...wellnessUrls,
  ];
}

