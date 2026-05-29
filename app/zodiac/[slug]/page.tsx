import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { hybridTopics, getHybridTopicBySlug } from "@/data/seo/hybridTopics";
import { buildTopicMetadata } from "@/lib/seo/metadataBuilder";

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return hybridTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const topic = getHybridTopicBySlug(params.slug);
  if (!topic) return {};
  return buildTopicMetadata(topic, "/zodiac");
}

export default function ZodiacHybridPage({ params }: Props) {
  const topic = getHybridTopicBySlug(params.slug);
  if (!topic) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";
  const pageUrl = `${baseUrl}/zodiac/${topic.slug}`;

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Zodiac calm",
        item: `${baseUrl}/zodiac`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: topic.title,
        item: pageUrl,
      },
    ],
  };

  const webPageSchema = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: topic.metaTitle,
    description: topic.metaDescription,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [webPageSchema, breadcrumbSchema],
  };

  const hasWhenToUse = topic.whenToUse && topic.whenToUse.length > 0;

  const sessionUrl =
    topic.category === "hybrid" && topic.slug.endsWith("-meditation")
      ? `/meditation?mode=meditation&mood=${encodeURIComponent(topic.mood ?? "")}`
      : `/meditation?mode=breathing`;

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-200"
          >
            ← Back to home / Volver al inicio
          </Link>
          <Link
            href="/horoscope"
            className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300"
          >
            Horoscope hub / Centro de horóscopos
          </Link>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            Zodiac calm & ritual ideas
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {topic.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
            {topic.intro}
          </p>
        </section>

        {topic.benefits && topic.benefits.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              How this can help
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {topic.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        )}

        {hasWhenToUse && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              When to use this page
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {topic.whenToUse!.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl bg-white p-6 text-sm shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Start a calm session
            </h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Use this page as a bridge between astrology and nervous system support. Read your
              current themes, then open a meditation or breathing session tuned to how you feel.
            </p>
            <Link
              href={sessionUrl}
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Start this calm session
            </Link>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Connect with your sign&apos;s horoscope
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Pair this ritual page with the daily, weekly, or monthly horoscope for the same
                sign to create a fuller reflection practice.
              </p>
              {topic.zodiacSign && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/horoscope/${topic.zodiacSign}/today`}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Today
                  </Link>
                  <Link
                    href={`/horoscope/${topic.zodiacSign}/weekly`}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Weekly
                  </Link>
                  <Link
                    href={`/horoscope/${topic.zodiacSign}/monthly`}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Monthly
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Premium rituals
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Premium helps you turn these ideas into deeper rituals with longer sessions,
                soundscapes, and sign-themed narration.
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                See Premium plan
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

