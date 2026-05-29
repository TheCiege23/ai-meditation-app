import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  subject: z.enum(["billing", "account", "bug", "feedback", "privacy", "other"]),
  message: z.string().min(10).max(4000),
});

const SUBJECT_LABELS: Record<string, string> = {
  billing: "Billing & subscription",
  account: "Account access",
  bug: "Report a bug",
  feedback: "Product feedback",
  privacy: "Privacy request",
  other: "Other",
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 422 });
  }

  const { name, email, subject, message } = parsed.data;
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  const apiKey = process.env.RESEND_API_KEY;
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@chimaura.com";
  const from = process.env.EMAIL_FROM ?? "Chimaura <no-reply@chimaura.com>";

  if (!apiKey) {
    // Dev mode — log and succeed silently
    console.log("[contact:dev]", { name, email, subject, message });
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from,
      to: supportEmail,
      replyTo: email,
      subject: `[Contact] ${subjectLabel} — ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${subjectLabel}`,
        ``,
        `Message:`,
        message,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[contact:error]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
