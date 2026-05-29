"use client";

import { useEffect, useRef, useState } from "react";

type StripeBuyButtonEmbedProps = {
  buyButtonId: string;
  publishableKey: string;
  className?: string;
  fallbackLabel?: string;
};

declare global {
  interface Window {
    __stripeBuyButtonScriptPromise?: Promise<void>;
  }
}

function ensureStripeBuyButtonScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.customElements?.get("stripe-buy-button")) {
    return Promise.resolve();
  }

  if (window.__stripeBuyButtonScriptPromise) {
    return window.__stripeBuyButtonScriptPromise;
  }

  window.__stripeBuyButtonScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-stripe-buy-button="true"]');

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Stripe buy button script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    script.dataset.stripeBuyButton = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Stripe buy button script failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return window.__stripeBuyButtonScriptPromise;
}

export default function StripeBuyButtonEmbed({
  buyButtonId,
  publishableKey,
  className = "",
  fallbackLabel = "Stripe checkout is unavailable right now. Use the linked checkout button below.",
}: StripeBuyButtonEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    void ensureStripeBuyButtonScript()
      .then(() => {
        if (!active || !containerRef.current) {
          return;
        }

        containerRef.current.replaceChildren();
        const buyButton = document.createElement("stripe-buy-button");
        buyButton.setAttribute("buy-button-id", buyButtonId);
        buyButton.setAttribute("publishable-key", publishableKey);
        containerRef.current.appendChild(buyButton);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Stripe buy button failed to initialize:", error);
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [buyButtonId, publishableKey]);

  return (
    <div className={className}>
      <div ref={containerRef} className={status === "loading" ? "min-h-[72px]" : undefined} />
      {status === "loading" ? <p className="text-xs text-slate-500 dark:text-slate-400">Loading Stripe checkout...</p> : null}
      {status === "error" ? <p className="text-xs text-rose-600 dark:text-rose-300">{fallbackLabel}</p> : null}
    </div>
  );
}
