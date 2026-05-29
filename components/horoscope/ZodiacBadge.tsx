type ZodiacBadgeProps = {
  sign: string;
};

export default function ZodiacBadge({ sign }: ZodiacBadgeProps) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/20 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#155e75_100%)] text-lg font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
      {sign.slice(0, 2).toUpperCase()}
    </div>
  );
}