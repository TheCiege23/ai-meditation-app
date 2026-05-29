import { useEffect, useState } from "react";

import type { Viewer } from "@/lib/types";
import type { Entitlements } from "@/lib/entitlements";

type SubscriptionState = {
  user: Viewer | null;
  entitlements: Entitlements | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [user, setUser] = useState<Viewer | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      setUser(data.user ?? null);
      setEntitlements(data.entitlements ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { user, entitlements, isLoading, refresh };
}