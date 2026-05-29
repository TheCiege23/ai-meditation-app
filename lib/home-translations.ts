import type { AppLanguage } from "@/lib/types";

export type HomeCopy = {
  startHere: string;
  headline: string;
  subtext: string;
  createFreeAccount: string;
  continueAsGuest: string;
  tryGuestSession: string;
  seePremiumPackage: string;
  startMyQuickSession: string;
  manageBilling: string;
  upgradeToPremium: string;
  startQuickSession: string;
  premiumActive: string;
  createAccountToUnlockPremium: string;
  upgradeNow: string;
  openPricing: string;
  premium: string;
  moreSessionsVoicesTools: string;
  session: string;
  signUpForPresets: string;
  account: string;
  dashboard: string;
  dailyHoroscope: string;
  todaysReflection: string;
  horoscopeSubtext: string;
  refreshHoroscope: string;
  refreshing: string;
  endSession: string;
  freeHighlights: string[];
  premiumHighlights: string[];
  guestTagline: string;
  horoscopeGuestNote: string;
  horoscopeFreeNote: string;
  horoscopePremiumNote: string;
}

const HOME_COPY_EN: HomeCopy = {
  startHere: "Start here",
  headline: "Guided calm in a few taps",
  subtext: "Build a short meditation or breathing session, then play. Create a free account to save presets and keep your streak.",
  createFreeAccount: "Create Free Account",
  continueAsGuest: "Continue As Guest",
  tryGuestSession: "Try Guest Session",
  seePremiumPackage: "See Premium Package",
  startMyQuickSession: "Start My Quick Session",
  manageBilling: "Manage Billing",
  upgradeToPremium: "Upgrade To Premium",
  startQuickSession: "Start Quick Session",
  premiumActive: "Premium Active",
  createAccountToUnlockPremium: "Create Account To Unlock Premium",
  upgradeNow: "Upgrade Now",
  openPricing: "Open Pricing",
  premium: "Premium",
  moreSessionsVoicesTools: "More sessions, voices & tools",
  session: "Session",
  signUpForPresets: "Sign up for presets; premium adds history, favorites & more.",
  account: "Account",
  dashboard: "Dashboard",
  dailyHoroscope: "Daily horoscope",
  todaysReflection: "Today's reflection",
  horoscopeSubtext: "Preview by sign. Create an account to save your sign; premium unlocks weekly and longer ranges.",
  refreshHoroscope: "Refresh Horoscope",
  refreshing: "Refreshing...",
  endSession: "End Session",
  freeHighlights: [
    "Save presets and return to your preferred calm setup.",
    "Keep your streak, session stats, and checkout status tied to your email.",
    "Restore your plan and premium access faster on every visit.",
  ],
  premiumHighlights: [
    "Unlimited meditation, speech, and horoscope sessions.",
    "Longer sessions up to 60 minutes, plus sleep mode and weekly astrology.",
    "All guide voices, layered sound mixer, favorites, and session history.",
  ],
  guestTagline: "Try guided sessions now. Create a free account to save presets and unlock more.",
  horoscopeGuestNote: "Sign up to save your sign and keep premium access tied to your account.",
  horoscopeFreeNote: "Upgrade for weekly horoscope and more time ranges.",
  horoscopePremiumNote: "You have access to weekly astrology and extended ranges.",
};

const HOME_COPY_ES: HomeCopy = {
  startHere: "Empieza aquí",
  headline: "Calma guiada en pocos toques",
  subtext: "Crea una meditación o sesión de respiración corta y ponla en marcha. Crea una cuenta gratis para guardar presets y mantener tu racha.",
  createFreeAccount: "Crear cuenta gratis",
  continueAsGuest: "Continuar como invitado",
  tryGuestSession: "Probar sesión de invitado",
  seePremiumPackage: "Ver paquete Premium",
  startMyQuickSession: "Iniciar mi sesión rápida",
  manageBilling: "Gestionar facturación",
  upgradeToPremium: "Pasar a Premium",
  startQuickSession: "Iniciar sesión rápida",
  premiumActive: "Premium activo",
  createAccountToUnlockPremium: "Crear cuenta para desbloquear Premium",
  upgradeNow: "Actualizar ahora",
  openPricing: "Ver precios",
  premium: "Premium",
  moreSessionsVoicesTools: "Más sesiones, voces y herramientas",
  session: "Sesión",
  signUpForPresets: "Regístrate para guardar presets; Premium añade historial, favoritos y más.",
  account: "Cuenta",
  dashboard: "Panel",
  dailyHoroscope: "Horóscopo diario",
  todaysReflection: "Reflexión de hoy",
  horoscopeSubtext: "Vista previa por signo. Crea una cuenta para guardar tu signo; Premium desbloquea rangos semanales y más largos.",
  refreshHoroscope: "Actualizar horóscopo",
  refreshing: "Actualizando...",
  endSession: "Terminar sesión",
  freeHighlights: [
    "Guarda presets y vuelve a tu configuración de calma preferida.",
    "Mantén tu racha, estadísticas y estado de pago ligados a tu correo.",
    "Recupera tu plan y acceso premium más rápido en cada visita.",
  ],
  premiumHighlights: [
    "Sesiones ilimitadas de meditación, voz y horóscopo.",
    "Sesiones de hasta 60 minutos, modo sueño y astrología semanal.",
    "Todas las voces guía, mezcla de sonidos, favoritos e historial de sesiones.",
  ],
  guestTagline: "Prueba sesiones guiadas ahora. Crea una cuenta gratis para guardar presets y desbloquear más.",
  horoscopeGuestNote: "Regístrate para guardar tu signo y mantener el acceso premium en tu cuenta.",
  horoscopeFreeNote: "Actualiza para horóscopo semanal y más rangos de tiempo.",
  horoscopePremiumNote: "Tienes acceso a astrología semanal y rangos extendidos.",
};

export function getHomeCopy(language: AppLanguage): HomeCopy {
  return language === "es" ? HOME_COPY_ES : HOME_COPY_EN;
}

const TIMER_STYLE_LABELS: Record<string, Record<AppLanguage, string>> = {
  "minimal-ring": { en: "Minimal ring", es: "Anillo mínimo" },
  "zen-ring": { en: "Zen ring", es: "Anillo zen" },
  "glowing-orb": { en: "Glowing orb", es: "Orbe luminoso" },
  "lotus-bloom": { en: "Lotus bloom", es: "Flor de loto" },
  "mandala-pulse": { en: "Mandala pulse", es: "Pulso mandala" },
  wave: { en: "Wave", es: "Onda" },
};

export function getTimerStyleLabel(value: string, language: AppLanguage): string {
  return TIMER_STYLE_LABELS[value]?.[language] ?? TIMER_STYLE_LABELS[value]?.en ?? value;
}

const VISUAL_SCENE_LABELS: Record<string, Record<AppLanguage, string>> = {
  mist: { en: "Morning Mist", es: "Niebla matinal" },
  sunrise: { en: "Golden Sunrise", es: "Amanecer dorado" },
  forest: { en: "Forest Calm", es: "Bosque tranquilo" },
  night: { en: "Night Tide", es: "Marea nocturna" },
  "ocean-dusk": { en: "Ocean Dusk", es: "Atardecer oceánico" },
  starfield: { en: "Starfield", es: "Campo de estrellas" },
};

export function getVisualSceneLabel(value: string, language: AppLanguage): string {
  return VISUAL_SCENE_LABELS[value]?.[language] ?? VISUAL_SCENE_LABELS[value]?.en ?? value;
}
