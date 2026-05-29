export type SubscriptionTier = "free" | "premium";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type HoroscopeSource = "freeastroapi" | "mock";
export type UserRole = "user" | "admin" | "super_admin";
export type PlatformType = "web" | "ios" | "android" | "all";

export type Viewer = {
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  displayName: string;
  isGuest: boolean;
  isAdmin: boolean;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string | null;
};

export type RequestIdentity = {
  viewer: Viewer;
  userId: string | null;
  identifier: string;
  ip: string;
  ipHash: string;
  userAgent: string | null;
  isAuthenticated: boolean;
};

export type AppLanguage = "en" | "es";

export type YogaFocus =
  | "stress_relief"
  | "sleep_wind_down"
  | "lower_back"
  | "morning_flow"
  | "desk_reset"
  | "full_body_reset";

export type YogaLevel = "beginner" | "intermediate" | "advanced";

export type YogaSessionPlan = {
  id: string;
  title: string;
  titleEs: string;
  language: AppLanguage;
  focus: YogaFocus;
  level: YogaLevel;
  totalSeconds: number;
  poseIds: string[];
};

export type UserProfileSnapshot = {
  fullName: string | null;
  birthdate: string | null;
  zodiacSign: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  preferredMood: string | null;
  preferredLanguage: AppLanguage | null;
};

export type NotificationPreferencesInput = {
  enablePush?: boolean;
  dailyReminder?: boolean;
  meditationReminder?: boolean;
  sleepReminder?: boolean;
  streakReminder?: boolean;
  horoscopeReminder?: boolean;
  billingAlerts?: boolean;
  productAnnouncements?: boolean;
  adminBroadcasts?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;

  breathingReminderEnabled?: boolean;
  breathingReminderTime?: string | null;
  meditationReminderEnabled?: boolean;
  meditationReminderTime?: string | null;
  sleepReminderEnabled?: boolean;
  sleepReminderTime?: string | null;
  horoscopeReminderEnabled?: boolean;
  horoscopeReminderTime?: string | null;
  bibleVerseReminderEnabled?: boolean;
  bibleVerseReminderTime?: string | null;
};

export type PushRegistrationPayload = {
  platform: PlatformType;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceLabel?: string | null;
  appVersion?: string | null;
};
