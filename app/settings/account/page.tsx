"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/language/LanguageContext";

type AccountState = {
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
};

type FeedbackState = {
  tone: "error" | "success";
  text: string;
} | null;

export default function AccountSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [account, setAccount] = useState<AccountState | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "call">("sms");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [pendingAction, setPendingAction] = useState<"email" | "send-otp" | "verify-otp" | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data?.user || data.user.isGuest || !data.user.email) {
          router.replace("/sign-in");
          return;
        }

        setAccount({
          email: data.user.email,
          emailVerified: Boolean(data.user.emailVerified),
          phoneNumber: data.user.phoneNumber ?? null,
          phoneVerified: Boolean(data.user.phoneVerified),
        });
        setPhoneInput(data.user.phoneNumber ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setFeedback({
            tone: "error",
            text:
              language === "es"
                ? "No se pudo cargar la cuenta. Intentalo de nuevo."
                : "We couldn't load your account. Please try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAccount(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, router]);

  useEffect(() => {
    if (!searchParams) return;

    const verification = searchParams.get("verification");
    if (verification === "sent") {
      setFeedback({
        tone: "success",
        text:
          language === "es"
            ? "Te enviamos un correo de verificacion. Revisa tu bandeja de entrada."
            : "We sent you a verification email. Check your inbox.",
      });
      return;
    }

    if (verification === "email-pending") {
      setFeedback({
        tone: "error",
        text:
          language === "es"
            ? "Tu cuenta fue creada, pero no pudimos enviar el correo de verificacion. Solicita uno nuevo."
            : "Your account was created, but we could not send the verification email. Request a new one.",
      });
    }
  }, [language, searchParams]);

  const onResendEmail = async () => {
    setFeedback(null);
    setPendingAction("email");

    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setFeedback({
          tone: "error",
          text:
            data?.error ??
            (language === "es" ? "No se pudo reenviar la verificacion." : "Unable to resend verification."),
        });
        return;
      }

      setFeedback({
        tone: "success",
        text:
          language === "es"
            ? "Te enviamos un nuevo correo de verificacion."
            : "We sent you a new verification email.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text:
          language === "es"
            ? "No se pudo reenviar la verificacion."
            : "Unable to resend verification.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const onSendOtp = async () => {
    setFeedback(null);
    setPendingAction("send-otp");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chimaura-language": language,
        },
        body: JSON.stringify({ phone: phoneInput, channel: otpChannel }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; phoneNumber?: string } | null;

      if (!res.ok) {
        setFeedback({
          tone: "error",
          text: data?.error ?? (language === "es" ? "No se pudo enviar el codigo." : "Unable to send code."),
        });
        return;
      }

      const normalizedPhone = data?.phoneNumber ?? phoneInput;
      setAccount((prev) =>
        prev
          ? {
              ...prev,
              phoneNumber: normalizedPhone,
              phoneVerified: false,
            }
          : prev
      );
      setPhoneInput(normalizedPhone);
      setOtp("");
      setFeedback({
        tone: "success",
        text:
          otpChannel === "call"
            ? language === "es"
              ? "Te llamaremos con tu codigo de verificacion."
              : "We will call you with your verification code."
            : language === "es"
              ? "Te enviamos un codigo de verificacion por mensaje."
              : "We sent a verification code by text message.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: language === "es" ? "No se pudo enviar el codigo." : "Unable to send code.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const onVerifyOtp = async () => {
    setFeedback(null);
    setPendingAction("verify-otp");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setFeedback({
          tone: "error",
          text:
            data?.error ??
            (language === "es" ? "No se pudo verificar el codigo." : "Unable to verify code."),
        });
        return;
      }

      setAccount((prev) =>
        prev
          ? {
              ...prev,
              phoneNumber: phoneInput,
              phoneVerified: true,
            }
          : prev
      );
      setOtp("");
      setFeedback({
        tone: "success",
        text: language === "es" ? "Telefono verificado." : "Phone verified.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: language === "es" ? "No se pudo verificar el codigo." : "Unable to verify code.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (loadingAccount) {
    return (
      <main className="min-h-screen px-4 py-6 text-sm text-slate-600 dark:text-slate-300">
        {language === "es" ? "Cargando cuenta..." : "Loading account..."}
      </main>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-5 lg:px-8">
      <div className="app-container mx-auto max-w-3xl space-y-6">
        <section className="ca-card">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {language === "es" ? "Cuenta" : "Account"}
          </h1>

          <div className="mt-4 space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Correo electronico" : "Email"}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{account.email}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {account.emailVerified
                  ? language === "es"
                    ? "Verificado"
                    : "Verified"
                  : language === "es"
                    ? "No verificado"
                    : "Not verified"}
              </p>
              {!account.emailVerified ? (
                <button
                  className="mt-3 ca-btn ca-btn-primary"
                  type="button"
                  disabled={pendingAction !== null}
                  onClick={onResendEmail}
                >
                  {pendingAction === "email"
                    ? language === "es"
                      ? "Enviando..."
                      : "Sending..."
                    : language === "es"
                      ? "Reenviar verificacion"
                      : "Resend verification"}
                </button>
              ) : null}
            </div>

            <div className="border-t border-slate-200/70 pt-4 dark:border-slate-800/80">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Telefono" : "Phone"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {account.phoneVerified
                  ? language === "es"
                    ? "Telefono verificado"
                    : "Phone verified"
                  : language === "es"
                    ? "Agrega tu telefono y verifica el codigo."
                    : "Add your phone number and verify the code."}
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === "es" ? "Metodo de entrega" : "Delivery method"}
                </label>
                <select
                  className="mt-1 ca-input"
                  value={otpChannel}
                  onChange={(event) =>
                    setOtpChannel(event.target.value === "call" ? "call" : "sms")
                  }
                >
                  <option value="sms">{language === "es" ? "Mensaje de texto" : "Text message"}</option>
                  <option value="call">{language === "es" ? "Llamada de voz" : "Voice call"}</option>
                </select>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                <input
                  className="ca-input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={language === "es" ? "Numero de telefono" : "Phone number"}
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                />
                <button
                  className="ca-btn ca-btn-primary"
                  type="button"
                  disabled={pendingAction !== null || !phoneInput.trim()}
                  onClick={onSendOtp}
                >
                  {pendingAction === "send-otp"
                    ? language === "es"
                      ? "Enviando..."
                      : "Sending..."
                    : language === "es"
                      ? "Enviar codigo"
                      : "Send code"}
                </button>
              </div>
              {account.phoneNumber ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {language === "es" ? "Telefono guardado:" : "Saved phone:"} {account.phoneNumber}
                </p>
              ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                <input
                  className="ca-input"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder={language === "es" ? "Codigo de 6 digitos" : "6-digit code"}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
                <button
                  className="ca-btn ca-btn-primary"
                  type="button"
                  disabled={pendingAction !== null || !otp.trim()}
                  onClick={onVerifyOtp}
                >
                  {pendingAction === "verify-otp"
                    ? language === "es"
                      ? "Verificando..."
                      : "Verifying..."
                    : language === "es"
                      ? "Verificar codigo"
                      : "Verify code"}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/70 pt-4 dark:border-slate-800/80">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Recordatorios" : "Reminders"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === "es"
                  ? "Configura horas para respiración, meditación, sueño, horóscopo y versículos."
                  : "Set times for breathing, meditation, sleep, horoscope, and bible verse reminders."}
              </p>
              <button
                className="mt-3 ca-btn ca-btn-primary"
                type="button"
                onClick={() => router.push("/settings/notifications")}
              >
                {language === "es" ? "Abrir recordatorios" : "Open reminder settings"}
              </button>
            </div>
          </div>

          {feedback ? (
            <p
              className={`mt-4 text-sm ${
                feedback.tone === "error"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
