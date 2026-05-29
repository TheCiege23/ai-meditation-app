import type { AppLanguage } from "@/lib/types";

export const en = {
  common: {
    language: {
      label: "Language",
      optionEn: "English",
      optionEs: "Español",
    },
    actions: {
      signIn: "Sign In",
      signUp: "Create account",
      createAccount: "Create Account",
      signOut: "Sign Out",
      goHome: "Go home",
      save: "Save",
      saving: "Saving...",
      close: "Close",
      openUpgradeWorkflow: "Open Upgrade Workflow",
      seeFullPricing: "See Full Pricing",
    },
    loading: {
      generic: "Loading...",
      account: "Loading account…",
      notificationSettings: "Loading notification settings...",
    },
    errors: {
      generic: "Something went wrong.",
      sessionEmpty: "Session text is empty.",
    },
  },
  auth: {
    headline: {
      signUp: "Create your ChimAura account",
      signIn: "Sign in to ChimAura",
    },
    cta: {
      primarySignUp: "Create Account",
      primarySignIn: "Sign In",
      loading: "Please wait...",
    },
    forgotPassword: "Forgot your password?",
  },
  dashboard: {
    errors: {
      signInRequired: "Sign in to view your dashboard.",
      loadFailed: "Failed to load dashboard.",
    },
    homeLink: "Home",
  },
  journal: {
    errors: {
      signInRequired: "Sign in to view your journal.",
      loadFailed: "Failed to load journal.",
    },
    empty: {
      noEntries: "No entries yet.",
      startSession: "Start a session →",
    },
  },
  progress: {
    errors: {
      signInRequired: "Sign in to see your progress.",
    },
  },
  notifications: {
    title: "Reminder settings",
    subtitle: "Choose the moments where ChimAura can gently reach out.",
    rows: {
      enablePush: "Enable push notifications",
      dailyReminder: "Daily reminder",
      meditationReminder: "Meditation reminder",
      sleepReminder: "Sleep reminder",
      streakReminder: "Streak reminder",
      horoscopeReminder: "Daily cosmic reflection reminder",
      billingAlerts: "Billing alerts",
      productAnnouncements: "Product updates",
      adminBroadcasts: "Important broadcasts",
    },
    quietHoursStart: "Quiet hours start",
    quietHoursEnd: "Quiet hours end",
    timezone: "Timezone",
    previewExamples:
      'Preview examples: “Your evening calm is ready”, “Take 3 mindful breaths with ChimAura”, “Your daily cosmic reflection is waiting”.',
    saveCta: "Save settings",
    savingCta: "Saving...",
    saveError: "Could not save notification preferences.",
    saveSuccess: "Notification preferences saved.",
  },
  pricing: {
    heroTag: "ChimAura Premium",
    heroTitle: "Deeper rituals, softer guidance, fewer limits.",
    heroBody:
      "Upgrade for premium voices, longer sessions, full sound mixing, sleep tools, richer cosmic reflection, and a calmer daily flow without free-tier limits cutting the experience short.",
    intervalMonthly: "Monthly",
    intervalYearly: "Yearly",
    free: {
      title: "Free",
      description:
        "A lighter introduction to ChimAura with enough access to build the habit before you go deeper.",
      cadence: "Always available",
      cta: "Current Free Plan",
    },
    premium: {
      title: "Premium",
      description:
        "Full access to ChimAura's premium meditation, astrology, and sleep rituals with monthly or annual billing.",
      badgeYearly: "Save 33%",
      ctaActive: "You are Premium",
      ctaLinked: "Use linked {interval} checkout",
      ctaPreparing: "Preparing linked checkout...",
      cadenceMonthly: "per month · billed monthly via Stripe subscription checkout",
      cadenceYearly: "per year · billed yearly via Stripe subscription checkout",
    },
    query: {
      success:
        "Your checkout was completed. Premium access will appear after Stripe finishes syncing.",
      cancelled:
        "Checkout was cancelled. You can try again whenever you're ready.",
    },
    linkedError: {
      startFailed: "Unable to start linked checkout.",
      missingRedirect: "Stripe checkout is missing a redirect URL.",
    },
  },
};

export const es = {
  common: {
    language: {
      label: "Idioma",
      optionEn: "Inglés",
      optionEs: "Español",
    },
    actions: {
      signIn: "Iniciar sesión",
      signUp: "Crear cuenta",
      createAccount: "Crear cuenta",
      signOut: "Cerrar sesión",
      goHome: "Ir al inicio",
      save: "Guardar",
      saving: "Guardando...",
      close: "Cerrar",
      openUpgradeWorkflow: "Abrir flujo de mejora",
      seeFullPricing: "Ver todos los precios",
    },
    loading: {
      generic: "Cargando...",
      account: "Cargando cuenta…",
      notificationSettings: "Cargando configuración de notificaciones...",
    },
    errors: {
      generic: "Algo salió mal.",
      sessionEmpty: "El texto de la sesión está vacío.",
    },
  },
  auth: {
    headline: {
      signUp: "Crea tu cuenta de ChimAura",
      signIn: "Inicia sesión en ChimAura",
    },
    cta: {
      primarySignUp: "Crear cuenta",
      primarySignIn: "Iniciar sesión",
      loading: "Por favor, espera...",
    },
    forgotPassword: "¿Olvidaste tu contraseña?",
  },
  dashboard: {
    errors: {
      signInRequired: "Inicia sesión para ver tu panel.",
      loadFailed: "No se pudo cargar el panel.",
    },
    homeLink: "Inicio",
  },
  journal: {
    errors: {
      signInRequired: "Inicia sesión para ver tu diario.",
      loadFailed: "No se pudo cargar el diario.",
    },
    empty: {
      noEntries: "Todavía no hay entradas.",
      startSession: "Iniciar una sesión →",
    },
  },
  progress: {
    errors: {
      signInRequired: "Inicia sesión para ver tu progreso.",
    },
  },
  notifications: {
    title: "Recordatorios",
    subtitle: "Elige en qué momentos ChimAura puede acercarse con suavidad.",
    rows: {
      enablePush: "Activar notificaciones push",
      dailyReminder: "Recordatorio diario",
      meditationReminder: "Recordatorio de meditación",
      sleepReminder: "Recordatorio de sueño",
      streakReminder: "Recordatorio de racha",
      horoscopeReminder: "Recordatorio de reflexión cósmica diaria",
      billingAlerts: "Alertas de facturación",
      productAnnouncements: "Novedades del producto",
      adminBroadcasts: "Comunicaciones importantes",
    },
    quietHoursStart: "Inicio de horas de silencio",
    quietHoursEnd: "Fin de horas de silencio",
    timezone: "Zona horaria",
    previewExamples:
      "Ejemplos de vista previa: «Tu calma nocturna está lista», «Toma 3 respiraciones conscientes con ChimAura», «Tu reflexión cósmica diaria te está esperando».",
    saveCta: "Guardar configuración",
    savingCta: "Guardando...",
    saveError: "No se pudo guardar la configuración de notificaciones.",
    saveSuccess: "Configuración de notificaciones guardada.",
  },
  pricing: {
    heroTag: "ChimAura Premium",
    heroTitle: "Rituales más profundos, guía más suave, menos límites.",
    heroBody:
      "Actualiza para acceder a voces premium, sesiones más largas, mezcla completa de sonidos, herramientas para el sueño, reflexión cósmica más rica y un flujo diario más calmado sin que los límites del plan gratuito corten la experiencia.",
    intervalMonthly: "Mensual",
    intervalYearly: "Anual",
    free: {
      title: "Gratis",
      description:
        "Una introducción más ligera a ChimAura con acceso suficiente para crear el hábito antes de ir más profundo.",
      cadence: "Siempre disponible",
      cta: "Plan gratuito actual",
    },
    premium: {
      title: "Premium",
      description:
        "Acceso completo a los rituales premium de meditación, astrología y sueño de ChimAura con facturación mensual o anual.",
      badgeYearly: "Ahorra un 33%",
      ctaActive: "Ya eres Premium",
      ctaLinked: "Usar checkout {interval} vinculado",
      ctaPreparing: "Preparando checkout vinculado...",
      cadenceMonthly: "al mes · facturado mensualmente a través de Stripe",
      cadenceYearly: "al año · facturado anualmente a través de Stripe",
    },
    query: {
      success:
        "Tu compra se ha completado. El acceso Premium aparecerá cuando Stripe termine de sincronizar.",
      cancelled:
        "La compra se canceló. Puedes intentarlo de nuevo cuando quieras.",
    },
    linkedError: {
      startFailed: "No se pudo iniciar el checkout vinculado.",
      missingRedirect: "Al checkout de Stripe le falta una URL de redirección.",
    },
  },
};

export type Messages = typeof en;

export const MESSAGES: Record<AppLanguage, Messages> = {
  en,
  es,
};

