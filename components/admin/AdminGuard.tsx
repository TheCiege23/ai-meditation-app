import type { ReactNode } from "react";

type AdminGuardProps = {
  roleLabel: string;
  children: ReactNode;
};

export default function AdminGuard({ roleLabel, children }: AdminGuardProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200/40 bg-sky-50/80 px-4 py-3 text-sm text-sky-900 dark:border-sky-200/10 dark:bg-sky-300/10 dark:text-sky-100">
        Admin access granted for {roleLabel.replace("_", " ")}.
      </div>
      {children}
    </div>
  );
}
