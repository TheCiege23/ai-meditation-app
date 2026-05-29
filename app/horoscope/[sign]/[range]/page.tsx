import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import {
  horoscopeTopics,
  getHoroscopeTopic,
  type HoroscopeRange,
  type HoroscopeSign,
} from "@/data/seo/horoscopeTopics";
import { buildTopicMetadata } from "@/lib/seo/metadataBuilder";

type Props = {
  params: { sign: HoroscopeSign; range: HoroscopeRange };
};

export async function generateStaticParams() {
  return horoscopeTopics.map((topic) => ({
    sign: topic.zodiacSign as HoroscopeSign,
    range: topic.timeRange as HoroscopeRange,
  }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const topic = getHoroscopeTopic(params.sign, params.range);
  if (!topic) return {};
  return buildTopicMetadata(topic, "/horoscope");
}

export default function HoroscopeTopicPage({ params }: Props) {
  const topic = getHoroscopeTopic(params.sign, params.range);
  if (!topic) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";
  const pageUrl = `${baseUrl}/horoscope/${params.sign}/${params.range}`;

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
        name: "Horoscope",
        item: `${baseUrl}/horoscope`,
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

  const signTitle = topic.title.split(" ")[0];

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
            All horoscopes / Todos los horóscopos
          </Link>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            Horoscope & calm reflection
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
              How to work with this horoscope
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {topic.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl bg-white p-6 text-sm shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Use this horoscope with calm tools
            </h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Read your {topic.timeRange} horoscope, then match what you notice with a short
              meditation or breathing practice instead of letting worry run the show.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/meditation/${params.sign}-meditation`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {signTitle} meditation page
              </Link>
              <Link
                href={"/meditation"}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                Start a calm session
              </Link>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Other {signTitle} horoscopes
              </h2>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href={`/horoscope/${params.sign}/today`}
                    className="text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Daily
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/horoscope/${params.sign}/weekly`}
                    className="text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Weekly
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/horoscope/${params.sign}/monthly`}
                    className="text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Monthly
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/horoscope/${params.sign}/yearly`}
                    className="text-sky-700 hover:underline dark:text-sky-300"
                  >
                    Yearly
                  </Link>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Premium calm rituals
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Premium unlocks longer meditations, richer breathing studios, and weekly
                reflection prompts that pair naturally with your horoscope check-ins.
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

