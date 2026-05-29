import type { TopicEntry } from "./topicTypes";
import type { HoroscopeSign } from "./horoscopeTopics";

function titleCaseSign(sign: HoroscopeSign): string {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

const HYBRID_SIGNS: HoroscopeSign[] = [
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
];

export const hybridTopics: TopicEntry[] = [
  // Sign + meditation
  ...HYBRID_SIGNS.map<TopicEntry>((sign) => {
    const signTitle = titleCaseSign(sign);
    const slug = `${sign}-meditation`;
    const metaTitle = `${signTitle} Meditation for Reflection and Calm | ChimAura`;
    const metaDescription = `Explore a ${signTitle}-themed meditation that connects typical sign traits with gentle reflection, calm breathing, and practical grounding rituals.`;

    return {
      slug,
      category: "hybrid",
      title: `${signTitle} Meditation`,
      h1: `${signTitle} Meditation for Reflection and Calm`,
      metaTitle,
      metaDescription,
      intro:
        `${signTitle} energy has its own rhythm. This meditation page connects common themes for ${signTitle}—both the gifts and the stress points—with a calm session you can actually use: a short guided meditation, simple breathing, and a few prompts for daily reflection.`,
      benefits: [
        `Reflect on how ${signTitle} themes show up in your actual life instead of only in abstract descriptions.`,
        "Pair sign-based insight with nervous system care so reflection feels grounding, not overwhelming.",
        "Create a small, repeatable ritual that helps you check in with yourself through the lens of your sign.",
      ],
      whenToUse: [
        "When you want to connect to your sign in a more embodied, grounded way.",
        "When horoscope themes feel loud and you need a practical calm ritual to match them.",
        "When you want a monthly or weekly reset that feels personally relevant.",
      ],
      zodiacSign: sign,
      relatedSlugs: [
        `${sign}-today`,
        `${sign}-weekly`,
        "meditation-for-anxiety",
        "grounding-meditation",
      ],
      keywords: [`${signTitle} meditation`, `${signTitle} calm`, `${signTitle} reflection`],
      premiumCTA:
        "Upgrade to create longer sign-themed meditations with premium voices, breathing patterns, and ambient soundscapes tuned to your current season.",
    };
  }),
  // Breathing for sign / calm routines
  {
    slug: "breathing-for-aries",
    category: "hybrid",
    title: "Breathing for Aries",
    h1: "Breathing for Aries Calm and Reset",
    metaTitle: "Breathing for Aries Calm and Reset | ChimAura",
    metaDescription:
      "Use this Aries breathing routine when energy runs hot, decisions feel rushed, or you want to slow down without losing your spark.",
    intro:
      "Aries energy can be bold, quick, and intense. This breathing-focused page offers calmer, more grounded breathing patterns for Aries seasons—times when you’re moving fast and could use a steadier rhythm.",
    benefits: [
      "Soften impulsive, heat-of-the-moment reactions with a few slow breaths.",
      "Create a space to pause before you commit to a decision.",
      "Honor Aries momentum while giving your nervous system a chance to catch up.",
    ],
    whenToUse: [
      "Before or after tough conversations where tempers might flare.",
      "When you feel impatient, rushed, or unusually reactive.",
      "During Aries transits or whenever life feels especially fiery.",
    ],
    zodiacSign: "aries",
    relatedSlugs: ["box-breathing", "breathing-for-stress", "aries-today"],
    keywords: ["Aries breathing", "breathing for Aries"],
  },
  {
    slug: "reflection-for-virgo",
    category: "hybrid",
    title: "Reflection for Virgo",
    h1: "Reflection for Virgo Calm and Clarity",
    metaTitle: "Reflection for Virgo Calm and Clarity | ChimAura",
    metaDescription:
      "Explore a Virgo reflection routine that balances analysis with self-compassion so you can review, adjust, and rest.",
    intro:
      "Virgo energy often notices every detail. This reflection-focused page offers a calmer way to review your day: a short meditation, gentle breathing, and prompts that move you away from self-criticism and toward grounded improvement.",
    benefits: [
      "Shift from harsh self-judgment into kinder self-review.",
      "Use your eye for detail to refine, not punish.",
      "Pair journaling prompts with calming breath and guided reflection.",
    ],
    whenToUse: [
      "At the end of days when you feel like you didn’t do enough.",
      "When perfectionism is making it hard to rest.",
      "During Virgo seasons or whenever you’re in a heavy review cycle.",
    ],
    zodiacSign: "virgo",
    relatedSlugs: ["daily-reflection", "gratitude-meditation", "virgo-today"],
    keywords: ["Virgo reflection", "Virgo meditation"],
  },
  {
    slug: "calm-routine-for-pisces",
    category: "hybrid",
    title: "Calm Routine for Pisces",
    h1: "Calm Routine for Pisces Sensitivity",
    metaTitle: "Calm Routine for Pisces Sensitivity | ChimAura",
    metaDescription:
      "Build a gentle Pisces calm routine with soft meditation, breathing, and reflection for days when emotions run deep.",
    intro:
      "Pisces energy can be deeply feeling and intuitive—and sometimes that’s a lot to hold. This calm routine combines soft meditation, slower breathing, and reflective prompts so your sensitivity feels like a gift, not a weight.",
    benefits: [
      "Give big feelings a safe, structured place to land.",
      "Use intuitive imagery and gentle narration to soothe your system.",
      "Create a repeated ritual you can return to when the world feels loud.",
    ],
    whenToUse: [
      "On days when you feel emotionally flooded or extra porous.",
      "When you want to reconnect with your inner world without getting lost in it.",
      "During Pisces seasons or whenever life feels especially watery and emotional.",
    ],
    zodiacSign: "pisces",
    relatedSlugs: ["sleep-meditation", "breathing-for-overwhelm", "pisces-today"],
    keywords: ["Pisces calm", "Pisces meditation routine"],
  },
];

export function getHybridTopicBySlug(slug: string): TopicEntry | undefined {
  return hybridTopics.find((topic) => topic.slug === slug);
}

