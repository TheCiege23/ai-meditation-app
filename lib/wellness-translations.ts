import type { AppLanguage } from "@/lib/types";

export type WellnessCopy = {
  dashboard: string;
  dailyWellness: string;
  todaysRecommendation: string;
  todaysBreathing: string;
  dailyHoroscopeSummary: string;
  inspirationalQuote: string;
  currentStreak: string;
  streakDays: string;
  longestStreak: string;
  totalMindfulMinutes: string;
  weeklyMinutes: string;
  moodSummary: string;
  quickStart: string;
  startMeditation: string;
  startBreathing: string;
  emergencyCalm: string;
  needAMoment: string;
  emergencyCalmSubtitle: string;
  journal: string;
  journalReflection: string;
  journalGratitude: string;
  postSessionReflection: string;
  whatDidYouNotice: string;
  gratitudePrompt: string;
  oneThingGrateful: string;
  saveEntry: string;
  pastEntries: string;
  courses: string;
  multiDayPrograms: string;
  startCourse: string;
  continueCourse: string;
  day: string;
  progress: string;
  weeklyInsights: string;
  monthlyInsights: string;
  achievements: string;
  badges: string;
  moodCheck: string;
  howAreYouFeeling: string;
  calm: string;
  stressed: string;
  anxious: string;
  hopeful: string;
  tired: string;
  grateful: string;
  overwhelmed: string;
  focused: string;
  skip: string;
  soundMixer: string;
  mixSounds: string;
  volume: string;
  morningRoutine: string;
  eveningWindDown: string;
  sleepMeditation: string;
  sleepStory: string;
  nightSoundscape: string;
  reminderSchedule: string;
  smartReminders: string;
  premiumLock: string;
  upgradeToUnlock: string;
  dailyWisdom: string;
  focusTimer: string;
  mindfulWorkMode: string;
  beginnerPath: string;
  recentlyCompleted: string;
  favoritesLibrary: string;
};

const EN: WellnessCopy = {
  dashboard: "Dashboard",
  dailyWellness: "Daily wellness",
  todaysRecommendation: "Today's meditation",
  todaysBreathing: "Today's breathing",
  dailyHoroscopeSummary: "Cosmic reflection",
  inspirationalQuote: "Daily wisdom",
  currentStreak: "Current streak",
  streakDays: "days",
  longestStreak: "Longest streak",
  totalMindfulMinutes: "Total mindful minutes",
  weeklyMinutes: "This week",
  moodSummary: "Mood",
  quickStart: "Quick start",
  startMeditation: "Start meditation",
  startBreathing: "Start breathing",
  emergencyCalm: "Emergency calm",
  needAMoment: "I need a moment",
  emergencyCalmSubtitle: "1-minute calming breath with a gentle quote",
  journal: "Journal",
  journalReflection: "Reflection",
  journalGratitude: "Gratitude",
  postSessionReflection: "Reflection after session",
  whatDidYouNotice: "What did you notice?",
  gratitudePrompt: "Gratitude",
  oneThingGrateful: "One thing you're grateful for",
  saveEntry: "Save",
  pastEntries: "Past entries",
  courses: "Courses",
  multiDayPrograms: "Multi-day programs",
  startCourse: "Start",
  continueCourse: "Continue",
  day: "Day",
  progress: "Progress",
  weeklyInsights: "Weekly insights",
  monthlyInsights: "Monthly insights",
  achievements: "Achievements",
  badges: "Badges",
  moodCheck: "Mood check",
  howAreYouFeeling: "How are you feeling?",
  calm: "Calm",
  stressed: "Stressed",
  anxious: "Anxious",
  hopeful: "Hopeful",
  tired: "Tired",
  grateful: "Grateful",
  overwhelmed: "Overwhelmed",
  focused: "Focused",
  skip: "Skip",
  soundMixer: "Sound mixer",
  mixSounds: "Mix sounds",
  volume: "Volume",
  morningRoutine: "Morning routine",
  eveningWindDown: "Evening wind-down",
  sleepMeditation: "Sleep meditation",
  sleepStory: "Sleep story",
  nightSoundscape: "Night soundscape",
  reminderSchedule: "Reminder schedule",
  smartReminders: "Smart reminders",
  premiumLock: "Premium",
  upgradeToUnlock: "Upgrade to unlock",
  dailyWisdom: "Daily wisdom",
  focusTimer: "Focus timer",
  mindfulWorkMode: "Mindful work mode",
  beginnerPath: "Beginner path",
  recentlyCompleted: "Recently completed",
  favoritesLibrary: "Favorites",
};

const ES: WellnessCopy = {
  dashboard: "Panel",
  dailyWellness: "Bienestar diario",
  todaysRecommendation: "Meditación de hoy",
  todaysBreathing: "Respiración de hoy",
  dailyHoroscopeSummary: "Reflexión cósmica",
  inspirationalQuote: "Sabiduría diaria",
  currentStreak: "Racha actual",
  streakDays: "días",
  longestStreak: "Racha más larga",
  totalMindfulMinutes: "Minutos conscientes totales",
  weeklyMinutes: "Esta semana",
  moodSummary: "Estado de ánimo",
  quickStart: "Inicio rápido",
  startMeditation: "Iniciar meditación",
  startBreathing: "Iniciar respiración",
  emergencyCalm: "Calma de emergencia",
  needAMoment: "Necesito un momento",
  emergencyCalmSubtitle: "1 minuto de respiración calmante con una frase suave",
  journal: "Diario",
  journalReflection: "Reflexión",
  journalGratitude: "Gratitud",
  postSessionReflection: "Reflexión después de la sesión",
  whatDidYouNotice: "¿Qué notaste?",
  gratitudePrompt: "Gratitud",
  oneThingGrateful: "Una cosa por la que estás agradecido",
  saveEntry: "Guardar",
  pastEntries: "Entradas anteriores",
  courses: "Cursos",
  multiDayPrograms: "Programas de varios días",
  startCourse: "Comenzar",
  continueCourse: "Continuar",
  day: "Día",
  progress: "Progreso",
  weeklyInsights: "Resumen semanal",
  monthlyInsights: "Resumen mensual",
  achievements: "Logros",
  badges: "Insignias",
  moodCheck: "Estado de ánimo",
  howAreYouFeeling: "¿Cómo te sientes?",
  calm: "Tranquilo",
  stressed: "Estresado",
  anxious: "Ansioso",
  hopeful: "Esperanzado",
  tired: "Cansado",
  grateful: "Agradecido",
  overwhelmed: "Abrumado",
  focused: "Concentrado",
  skip: "Omitir",
  soundMixer: "Mezclador de sonidos",
  mixSounds: "Mezclar sonidos",
  volume: "Volumen",
  morningRoutine: "Rutina matinal",
  eveningWindDown: "Relajación nocturna",
  sleepMeditation: "Meditación para dormir",
  sleepStory: "Historia para dormir",
  nightSoundscape: "Paisaje sonoro nocturno",
  reminderSchedule: "Recordatorios",
  smartReminders: "Recordatorios inteligentes",
  premiumLock: "Premium",
  upgradeToUnlock: "Actualiza para desbloquear",
  dailyWisdom: "Sabiduría diaria",
  focusTimer: "Temporizador de enfoque",
  mindfulWorkMode: "Modo trabajo consciente",
  beginnerPath: "Ruta para principiantes",
  recentlyCompleted: "Completados recientemente",
  favoritesLibrary: "Favoritos",
};

export function getWellnessCopy(language: AppLanguage): WellnessCopy {
  return language === "es" ? ES : EN;
}

export const MOOD_VALUES = [
  "calm",
  "stressed",
  "anxious",
  "hopeful",
  "tired",
  "grateful",
  "overwhelmed",
  "focused",
] as const;
