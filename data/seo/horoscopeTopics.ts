import type { TopicEntry } from "./topicTypes";

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

const RANGES = ["today", "weekly", "monthly", "yearly"] as const;

export type HoroscopeRange = (typeof RANGES)[number];
export type HoroscopeSign = (typeof SIGNS)[number];

function titleCaseSign(sign: HoroscopeSign): string {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

export const horoscopeTopics: TopicEntry[] = SIGNS.flatMap<TopicEntry>((sign) => {
  const signTitle = titleCaseSign(sign);

  return RANGES.map<TopicEntry>((range) => {
    const slug = `${sign}-${range}`;
    const baseTitle =
      range === "today"
        ? `${signTitle} Daily Horoscope`
        : range === "weekly"
        ? `${signTitle} Weekly Horoscope`
        : range === "monthly"
        ? `${signTitle} Monthly Horoscope`
        : `${signTitle} Yearly Horoscope`;

    const rangeLabel =
      range === "today"
        ? "today"
        : range === "weekly"
        ? "this week"
        : range === "monthly"
        ? "this month"
        : "this year";

    const shortRange =
      range === "today"
        ? "daily"
        : range === "weekly"
        ? "weekly"
        : range === "monthly"
        ? "monthly"
        : "yearly";

    const metaTitle = `${baseTitle} | ChimAura`;

    const metaDescription = `Read the ${shortRange} horoscope for ${signTitle} and pair it with a gentle meditation and breathing ritual to support your calm, reflective routine.`;

    const intro = `This ${shortRange} horoscope for ${signTitle} is designed to be paired with calm reflection instead of worry. Use it as a quiet check-in for themes and energy ${rangeLabel}, then match what you read with a short meditation or breathing session that supports how you actually feel.`;

    const benefits: string[] = [
      `Use your ${shortRange} horoscope as a prompt for mindful reflection instead of prediction anxiety.`,
      "Connect what you read to how your body feels, not just your thoughts.",
      "Build a simple ritual that combines spiritual curiosity with nervous system care.",
    ];

    return {
      slug,
      category: "horoscope",
      title: baseTitle,
      h1: `${baseTitle} and Calm Reflection`,
      metaTitle,
      metaDescription,
      intro,
      benefits,
      zodiacSign: sign,
      timeRange: range,
      relatedSlugs: [
        `${sign}-today`,
        `${sign}-weekly`,
        `${sign}-monthly`,
        `${sign}-yearly`,
      ].filter((s) => s !== slug),
      keywords: [
        `${signTitle} horoscope ${shortRange}`,
        `${signTitle} astrology`,
        `${signTitle} reflection`,
      ],
      premiumCTA:
        "Premium members can unlock longer sign-themed meditations, breathing sequences, and weekly planning rituals that line up with your current season.",
    };
  });
});

export function getHoroscopeTopic(sign: string, range: string): TopicEntry | undefined {
  return horoscopeTopics.find(
    (topic) => topic.zodiacSign === sign && topic.timeRange === range
  );
}

