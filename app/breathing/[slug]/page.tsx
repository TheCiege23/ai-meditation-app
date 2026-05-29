import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { breathingTopics, getBreathingTopicBySlug } from "@/data/seo/breathingTopics";
import { buildTopicMetadata } from "@/lib/seo/metadataBuilder";

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return breathingTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const topic = getBreathingTopicBySlug(params.slug);
  if (!topic) return {};
  return buildTopicMetadata(topic, "/breathing");
}

export default function BreathingTopicPage({ params }: Props) {
  const topic = getBreathingTopicBySlug(params.slug);
  if (!topic) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";
  const pageUrl = `${baseUrl}/breathing/${topic.slug}`;

  const startUrl = `/meditation?mode=breathing`;

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
        name: "Breathing",
        item: `${baseUrl}/breathing`,
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
            href="/breathing"
            className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300"
          >
            All breathing exercises / Todos los ejercicios de respiración
          </Link>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            Guided breathing · Respiración guiada
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {topic.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
            {topic.intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={startUrl}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Start this breathing exercise · Iniciar este ejercicio de respiración
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              View Premium · Ver Premium
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl bg-white p-6 text-sm shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Why this breathing pattern helps / Por qué ayuda este patrón de respiración
            </h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              This exercise uses simple, repeatable counts to nudge your nervous system toward a
              calmer, more grounded state.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              <li>Easy to remember and repeat, even on stressful days.</li>
              <li>Can be done sitting, standing, or lying down.</li>
              <li>Pairs well with a short follow-up meditation for deeper calm.</li>
              <li>Es fácil de recordar y repetir, incluso en días de mucho estrés.</li>
              <li>Puedes practicarlo sentado, de pie o acostado.</li>
              <li>Combina bien con una meditación corta después para una calma más profunda.</li>
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Try a guided meditation next / Prueba una meditación guiada después
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                After a few minutes of focused breathing, many people find it easier to drop into a
                short guided meditation.
              </p>
              <Link
                href="/meditation/meditation-for-anxiety"
                className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Meditation for anxiety · Meditación para la ansiedad
              </Link>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Upgrade for full breathing studio / Mejora para el estudio completo de respiración
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                ChimAura Premium unlocks all breathing patterns, longer sessions, ambient sounds,
                and AI voice guidance.
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                See Premium plan · Ver plan Premium
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

