import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { meditationTopics, getMeditationTopicBySlug } from "@/data/seo/meditationTopics";
import { buildTopicMetadata } from "@/lib/seo/metadataBuilder";
import { getRelatedTopics, topicHref } from "@/lib/seo/topicResolver";

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return meditationTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const topic = getMeditationTopicBySlug(params.slug);
  if (!topic) return {};
  return buildTopicMetadata(topic, "/meditation");
}

export default function MeditationTopicPage({ params }: Props) {
  const topic = getMeditationTopicBySlug(params.slug);
  if (!topic) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://chimaura.com";
  const pageUrl = `${baseUrl}/meditation/${topic.slug}`;

  const startUrl = `/meditation?mode=meditation&mood=${encodeURIComponent(
    topic.mood ?? ""
  )}&duration=${encodeURIComponent(
    topic.recommendedDuration ? `${topic.recommendedDuration} min` : "5 min"
  )}`;

  const related = getRelatedTopics(topic, 5);

  const faqSchema =
    topic.faq && topic.faq.length
      ? {
          "@type": "FAQPage",
          mainEntity: topic.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

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
        name: "Meditation",
        item: `${baseUrl}/meditation`,
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
    ...(faqSchema ? { "@graph": [webPageSchema, breadcrumbSchema, faqSchema] } : { "@graph": [webPageSchema, breadcrumbSchema] }),
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
            href="/meditation"
            className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300"
          >
            All meditations / Todas las meditaciones
          </Link>
        </header>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            Guided meditation · Meditación guiada
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {topic.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">
            {topic.intro}
          </p>
          {topic.recommendedDuration && (
            <>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Approximate length: {topic.recommendedDuration} minutes · Suggested mood setting:{" "}
                <span className="font-semibold">{topic.mood}</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Duración aproximada: {topic.recommendedDuration} minutos · Estado de ánimo
                sugerido: <span className="font-semibold">{topic.mood}</span>
              </p>
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={startUrl}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Start this meditation · Iniciar esta meditación
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              View Premium · Ver Premium
            </Link>
          </div>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Benefits of this meditation / Beneficios de esta meditación
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            This page is part of ChimAura&apos;s guided meditation library, designed to make
            it easy to match a short practice to how you feel right now.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>Use a clear time-boxed session so you can relax without clock-watching.</li>
            <li>Follow gentle voice guidance instead of trying to remember techniques.</li>
            <li>Return to the same practice on future days to build a simple habit.</li>
            <li>Utiliza una sesión con tiempo definido para relajarte sin mirar el reloj.</li>
            <li>Sigue una guía de voz suave en lugar de recordar la técnica por tu cuenta.</li>
            <li>Vuelve a esta misma práctica para construir un hábito sencillo día a día.</li>
          </ul>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl bg-white p-6 text-sm shadow-sm dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Related meditation topics / Temas de meditación relacionados
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={topicHref(other)}
                    className="text-sky-700 hover:underline dark:text-sky-300"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Explore breathing exercises / Explora ejercicios de respiración
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Pair this meditation with a short breathing pattern when you need a stronger
                reset for stress or anxiety.
              </p>
              <Link
                href="/breathing"
                className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                View breathing exercises · Ver ejercicios de respiración
              </Link>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Upgrade for longer sessions / Mejora para sesiones más largas
              </h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                ChimAura Premium unlocks longer meditations, full breathing studios, ambient
                sound mixing, and weekly cosmic reflections.
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

