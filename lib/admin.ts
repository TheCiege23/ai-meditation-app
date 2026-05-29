import type { UserRole } from "@/lib/types";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/usage", label: "Usage" },
  { href: "/admin/horoscope", label: "Horoscope" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/releases", label: "Releases" },
  { href: "/admin/flags", label: "Feature Flags" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/mobile", label: "Mobile" },
  { href: "/admin/finance", label: "Finance" },
] as const;

export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

export function isAdminRole(role: UserRole | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function maskStripeReference(value: string | null | undefined) {
  if (!value) {
    return "Not connected";
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export const ADMIN_CONTENT_SCAFFOLD = {
  fallbackReflection:
    "Your cosmic reflection is taking a moment to settle. Here is a gentler reset while we reconnect the stars.",
  fallbackAffirmation:
    "I can return to calm one breath at a time.",
  fallbackJournalPrompt:
    "What would it feel like to move through today with a softer pace and a clearer center?",
  upgradeCopy:
    "Upgrade to ChimAura Premium to unlock deeper rituals, premium voices, and longer guided sessions.",
  onboardingReminderCopy:
    "A softer rhythm is waiting for you inside ChimAura.",
  notificationTemplateCopy:
    "Your next calm moment is ready whenever you are.",
};
