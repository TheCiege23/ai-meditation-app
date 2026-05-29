"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type EnablePushCardProps = {
  onRegistered?: () => void;
};

export default function EnablePushCard({ onRegistered }: EnablePushCardProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const handleEnable = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifications are not supported in this browser yet.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const keyResponse = await fetch("/api/notifications/register", { cache: "no-store" });
      const keyData = await keyResponse.json();
      if (!keyData?.publicKey) {
        setMessage("Push setup is not configured on the server yet.");
        return;
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setMessage("Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/chimaura-sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      const response = await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subscription.toJSON(),
          platform: "web",
          deviceLabel: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data?.message ?? data?.error ?? "Failed to save your push settings.");
        return;
      }

      setMessage("Push reminders enabled. You can fine-tune what ChimAura sends below.");
      onRegistered?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Push reminders</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Invite ChimAura to gently check in</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        Daily reminders can help you come back to your breath, your evening wind-down, or your cosmic reflection without feeling noisy or urgent.
      </p>
      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        Permission state: <span className="font-semibold capitalize">{permission}</span>
      </div>
      <button
        type="button"
        onClick={() => void handleEnable()}
        disabled={isLoading || permission === "granted" || permission === "unsupported"}
        className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-200 dark:text-slate-950"
      >
        {isLoading ? "Enabling..." : permission === "granted" ? "Notifications enabled" : "Enable notifications"}
      </button>
      {message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
    </section>
  );
}
