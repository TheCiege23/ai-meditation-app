"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import UpgradeModal from "@/components/billing/UpgradeModal";

type SubscriptionPromptOptions = {
  feature: string;
};

type SubscriptionPromptContextValue = {
  openPrompt: (options: SubscriptionPromptOptions) => void;
  closePrompt: () => void;
};

const SubscriptionPromptContext = createContext<SubscriptionPromptContextValue | undefined>(
  undefined
);

export function SubscriptionPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [feature, setFeature] = useState<string | null>(null);

  const openPrompt = useCallback((options: SubscriptionPromptOptions) => {
    setFeature(options.feature);
  }, []);

  const closePrompt = useCallback(() => {
    setFeature(null);
  }, []);

  const value = useMemo(
    () => ({
      openPrompt,
      closePrompt,
    }),
    [openPrompt, closePrompt]
  );

  return (
    <SubscriptionPromptContext.Provider value={value}>
      {children}
      <UpgradeModal
        open={Boolean(feature)}
        onClose={closePrompt}
        feature={feature ?? "premium features"}
      />
    </SubscriptionPromptContext.Provider>
  );
}

export function useSubscriptionPrompt() {
  const context = useContext(SubscriptionPromptContext);

  if (!context) {
    throw new Error("useSubscriptionPrompt must be used inside SubscriptionPromptProvider.");
  }

  return context;
}
