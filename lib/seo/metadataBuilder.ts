import type { Metadata } from "next";
import type { TopicEntry } from "@/data/seo/topicTypes";

export function buildTopicMetadata(topic: TopicEntry, basePath: string): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";
  const url = `${baseUrl}${basePath}/${topic.slug}`;

  return {
    title: topic.metaTitle,
    description: topic.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: topic.metaTitle,
      description: topic.metaDescription,
      url,
      type: "article",
    },
  };
}

