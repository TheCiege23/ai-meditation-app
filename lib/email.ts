import { Resend } from "resend";

import type { AppLanguage } from "@/lib/types";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

async function sendEmail({ to, subject, text }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "ChimAura <no-reply@chimaura.com>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);

  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
  });

  if ((result as { error?: unknown } | null)?.error) {
    throw new Error("Resend rejected the email request.");
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  token: string;
  language: AppLanguage;
}) {
  const { to, token, language } = params;
  const baseUrl =
    process.env.PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/verify-email?token=${encodeURIComponent(
    token
  )}`;

  const subject =
    language === "es" ? "Verifica tu correo electronico" : "Verify your email address";
  const body =
    language === "es"
      ? `Confirma tu correo electronico haciendo clic en este enlace:\n\n${verifyUrl}\n\nSi no creaste esta cuenta, puedes ignorar este mensaje.`
      : `Confirm your email address by clicking this link:\n\n${verifyUrl}\n\nIf you didn't create this account, you can ignore this message.`;

  await sendEmail({ to, subject, text: body });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
  language: AppLanguage;
}) {
  const { to, token, language } = params;
  const baseUrl =
    process.env.PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password/confirm?token=${encodeURIComponent(
    token
  )}`;

  const subject =
    language === "es" ? "Restablece tu contrasena de ChimAura" : "Reset your ChimAura password";
  const body =
    language === "es"
      ? `Recibimos una solicitud para restablecer tu contrasena de ChimAura.\n\nPuedes crear una nueva contrasena usando este enlace:\n\n${resetUrl}\n\nSi no fuiste tu quien solicito este cambio, puedes ignorar este mensaje.`
      : `We received a request to reset your ChimAura password.\n\nYou can set a new password using this link:\n\n${resetUrl}\n\nIf you didn't request this change, you can safely ignore this email.`;

  await sendEmail({ to, subject, text: body });
}
