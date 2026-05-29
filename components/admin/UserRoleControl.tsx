"use client";

import { useState } from "react";

type UserRoleControlProps = {
  userId: string;
  currentRole: "user" | "admin" | "super_admin";
};

const roleOptions = ["user", "admin", "super_admin"] as const;

export default function UserRoleControl({ userId, currentRole }: UserRoleControlProps) {
  const [role, setRole] = useState(currentRole);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.message ?? data?.error ?? "Role update failed.");
        return;
      }
      setMessage("Role updated.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof currentRole)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isLoading}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-200 dark:text-slate-950"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
      {message ? <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p> : null}
    </div>
  );
}
