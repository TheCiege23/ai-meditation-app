export type TopicCategory = "meditation" | "breathing" | "horoscope" | "hybrid" | "wellness";

export type TopicFAQ = {
  question: string;
  answer: string;
};

export type TopicEntry = {
  slug: string;
  category: TopicCategory;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  benefits: string[];
  whenToUse?: string[];
  recommendedDuration?: number;
  mood?: string;
  zodiacSign?: string;
  timeRange?: "today" | "weekly" | "monthly" | "yearly";
  relatedSlugs?: string[];
  faq?: TopicFAQ[];
  premiumCTA?: string;
  keywords?: string[];
};

