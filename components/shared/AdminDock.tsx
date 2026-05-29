"use client";

import { useEffect, useState } from "react";

import AdminButton from "@/components/shared/AdminButton";

export default function AdminDock() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) {
          return;
        }
        setIsAdmin(Boolean(data?.user?.role === "admin" || data?.user?.role === "super_admin" || data?.user?.isAdmin));
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50">
      <AdminButton compact />
    </div>
  );
}
