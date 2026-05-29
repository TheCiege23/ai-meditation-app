import type { TopicEntry } from "@/data/seo/topicTypes";
import { meditationTopics } from "@/data/seo/meditationTopics";
import { breathingTopics } from "@/data/seo/breathingTopics";
import { horoscopeTopics } from "@/data/seo/horoscopeTopics";
import { hybridTopics } from "@/data/seo/hybridTopics";
import { wellnessTopics } from "@/data/seo/wellnessTopics";

const ALL_TOPICS: TopicEntry[] = [
  ...meditationTopics,
  ...breathingTopics,
  ...horoscopeTopics,
  ...hybridTopics,
  ...wellnessTopics,
];

export function getTopicBySlug(slug: string): TopicEntry | undefined {
  return ALL_TOPICS.find((topic) => topic.slug === slug);
}

export function getTopicsBySlugs(slugs: string[] | undefined): TopicEntry[] {
  if (!slugs?.length) return [];
  return slugs
    .map((slug) => getTopicBySlug(slug))
    .filter((topic): topic is TopicEntry => Boolean(topic));
}

export function getRelatedTopics(topic: TopicEntry, limit = 5): TopicEntry[] {
  if (topic.relatedSlugs && topic.relatedSlugs.length > 0) {
    return getTopicsBySlugs(topic.relatedSlugs)
      .filter((t) => t.slug !== topic.slug)
      .slice(0, limit);
  }

  // Fallback: same-category topics (excluding self), stable but not overlinked.
  return ALL_TOPICS.filter(
    (t) => t.category === topic.category && t.slug !== topic.slug
  ).slice(0, limit);
}

export function topicHref(topic: TopicEntry): string {
  if (topic.category === "meditation") {
    return `/meditation/${topic.slug}`;
  }
  if (topic.category === "breathing") {
    return `/breathing/${topic.slug}`;
  }
  if (topic.category === "horoscope") {
    if (topic.zodiacSign && topic.timeRange) {
      return `/horoscope/${topic.zodiacSign}/${topic.timeRange}`;
    }
    return `/horoscope`;
  }
  if (topic.category === "hybrid") {
    return `/zodiac/${topic.slug}`;
  }
  if (topic.category === "wellness") {
    return `/wellness/${topic.slug}`;
  }
  return "/";
}

