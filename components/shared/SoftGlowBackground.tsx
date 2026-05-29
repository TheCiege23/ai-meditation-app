type SoftGlowBackgroundProps = {
  className?: string;
  tone?: "cosmic" | "aurora" | "midnight";
};

const toneMap = {
  cosmic: {
    first: "from-cyan-300/22 via-sky-400/12 to-transparent",
    second: "from-amber-200/24 via-teal-200/10 to-transparent",
    third: "from-slate-900/0 via-sky-200/10 to-transparent",
  },
  aurora: {
    first: "from-emerald-200/22 via-cyan-200/14 to-transparent",
    second: "from-amber-100/18 via-sky-200/10 to-transparent",
    third: "from-slate-900/0 via-white/12 to-transparent",
  },
  midnight: {
    first: "from-sky-300/18 via-blue-300/12 to-transparent",
    second: "from-amber-100/16 via-cyan-200/10 to-transparent",
    third: "from-slate-900/0 via-slate-100/8 to-transparent",
  },
} as const;

export default function SoftGlowBackground({
  className = "",
  tone = "cosmic",
}: SoftGlowBackgroundProps) {
  const palette = toneMap[tone];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className={`absolute -left-16 top-0 h-72 w-72 rounded-full bg-linear-to-br blur-3xl ${palette.first}`}
      />
      <div
        className={`absolute right-0 top-14 h-80 w-80 rounded-full bg-linear-to-bl blur-3xl ${palette.second}`}
      />
      <div
        className={`absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-linear-to-t blur-3xl ${palette.third}`}
      />
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
    </div>
  );
}