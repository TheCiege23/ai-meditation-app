"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language/LanguageContext";

type NavItem = {
  href: string;
  icon: string;
  labelEn: string;
  labelEs: string;
  matchPrefixes: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",        icon: "▣", labelEn: "Home",      labelEs: "Inicio",   matchPrefixes: ["/dashboard"] },
  { href: "/meditation",       icon: "✦", labelEn: "Meditate",  labelEs: "Meditar",  matchPrefixes: ["/meditation", "/breathing", "/breathe"] },
  { href: "/calm",             icon: "◐", labelEn: "Calm",      labelEs: "Calma",    matchPrefixes: ["/calm"] },
  { href: "/horoscope",        icon: "◇", labelEn: "Horoscope", labelEs: "Horóscopo",matchPrefixes: ["/horoscope"] },
  { href: "/settings/account", icon: "◎", labelEn: "Account",   labelEs: "Cuenta",   matchPrefixes: ["/settings"] },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const isEs = language === "es";

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
      style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = item.matchPrefixes.some((p) => pathname.startsWith(p));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="tap-target flex flex-col items-center gap-0.5 px-3 py-3 text-center transition-colors"
            >
              <span
                className={`text-lg ${
                  active
                    ? "text-violet-600 opacity-100 dark:text-violet-400"
                    : "text-slate-500 opacity-70 dark:text-slate-400"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-medium sm:text-xs ${
                  active
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isEs ? item.labelEs : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

