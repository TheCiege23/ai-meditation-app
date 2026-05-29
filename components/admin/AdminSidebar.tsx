"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEMS } from "@/lib/admin";

type AdminSidebarProps = {
  roleLabel: string;
};

export default function AdminSidebar({ roleLabel }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 rounded-[2rem] border border-white/10 bg-slate-950/88 p-5 text-white shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-sky-200/65">ChimAura Admin</p>
        <h2 className="mt-3 text-2xl font-semibold">Operations</h2>
        <p className="mt-2 text-sm text-slate-300">Signed in as {roleLabel.replace("_", " ")}.</p>
      </div>

      <nav className="space-y-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950 shadow-lg"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
