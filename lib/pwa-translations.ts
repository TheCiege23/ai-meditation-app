import type { AppLanguage } from "@/lib/types";

export type PWACopy = {
  installTitle: string;
  installDescription: string;
  installCta: string;
  installDismiss: string;
  offlineTitle: string;
  offlineMessage: string;
  offlineRetry: string;
};

const EN: PWACopy = {
  installTitle: "Install ChimAura",
  installDescription: "Add to your home screen for a faster, app-like experience.",
  installCta: "Install app",
  installDismiss: "Not now",
  offlineTitle: "You're offline",
  offlineMessage: "Check your connection. Some features need the internet.",
  offlineRetry: "Try again",
};

const ES: PWACopy = {
  installTitle: "Instalar ChimAura",
  installDescription: "Añade a tu pantalla de inicio para una experiencia más rápida.",
  installCta: "Instalar app",
  installDismiss: "Ahora no",
  offlineTitle: "Sin conexión",
  offlineMessage: "Comprueba tu conexión. Algunas funciones necesitan internet.",
  offlineRetry: "Reintentar",
};

export function getPWACopy(language: AppLanguage): PWACopy {
  return language === "es" ? ES : EN;
}
