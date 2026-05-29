import type { DailyAffirmation } from "@/components/horoscope/types";
import { useLanguage } from "@/components/language/LanguageContext";

type DailyAffirmationCardProps = {
  affirmation: DailyAffirmation;
};

export default function DailyAffirmationCard({
  affirmation,
}: DailyAffirmationCardProps) {
  const { language } = useLanguage();
  const heading = language === "es" ? "Afirmación diaria" : "Daily affirmation";
  const saveLabel = language === "es" ? "Guardar" : "Save";
  const copyLabel = language === "es" ? "Copiar" : "Copy";

  return (
    <section className="ca-card">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {heading}
      </p>
      <blockquote className="mt-4 text-2xl leading-10 text-slate-950 dark:text-white">
        &quot;{affirmation.text}&quot;
      </blockquote>
      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {affirmation.whisper}
      </p>

      <div className="mt-5 flex gap-3">
        <button className="ca-btn ca-btn-ghost">
          {saveLabel}
        </button>
        <button className="ca-btn ca-btn-ghost">
          {copyLabel}
        </button>
      </div>
    </section>
  );
}