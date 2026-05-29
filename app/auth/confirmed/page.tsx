"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import LanguageSelector from "@/components/language/LanguageSelector";
import { useLanguage } from "@/components/language/LanguageContext";

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const status = searchParams.get("verified");
  const [resendState, setResendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [healthState, setHealthState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [healthMessage, setHealthMessage] = useState("");

  const canResend = status === "error" || status === "expired" || status === "invalid";

  const handleResend = async () => {
    try {
      setResendState("loading");
      setResendMessage("");

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chimaura-language": language,
        },
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setResendState("error");
        setResendMessage(
          data?.error ||
            data?.message ||
            (isSpanish
              ? "No pudimos reenviar el correo ahora. Intentalo de nuevo en unos minutos."
              : "We could not resend the email right now. Please try again in a few minutes.")
        );
        return;
      }

      setResendState("success");
      setResendMessage(
        isSpanish
          ? "Listo. Te enviamos un nuevo correo de verificacion. Revisa tambien tu carpeta de spam."
          : "Done. We sent a new verification email. Please also check your spam folder."
      );
    } catch {
      setResendState("error");
      setResendMessage(
        isSpanish
          ? "No pudimos reenviar el correo ahora. Intentalo de nuevo en unos minutos."
          : "We could not resend the email right now. Please try again in a few minutes."
      );
    }
  };

  const handleEmailHealthCheck = async () => {
    try {
      setHealthState("loading");
      setHealthMessage("");

      const response = await fetch("/api/auth/email-health", {
        method: "GET",
        headers: {
          "x-chimaura-language": language,
        },
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; missing?: string[]; message?: string; error?: string }
        | null;

      if (!response.ok) {
        setHealthState("error");
        if (response.status === 401) {
          setHealthMessage(
            isSpanish
              ? "Inicia sesion para ejecutar la verificacion de correo."
              : "Sign in to run the email health check."
          );
          return;
        }

        setHealthMessage(
          data?.error ||
            data?.message ||
            (isSpanish
              ? "No pudimos revisar la configuracion del correo ahora."
              : "We could not check email configuration right now.")
        );
        return;
      }

      if (data?.ok === false && Array.isArray(data.missing) && data.missing.length > 0) {
        setHealthState("error");
        setHealthMessage(
          (isSpanish ? "Falta configurar: " : "Missing configuration: ") + data.missing.join(", ")
        );
        return;
      }

      setHealthState("success");
      setHealthMessage(
        isSpanish
          ? "La configuracion de correo parece correcta."
          : "Email configuration looks healthy."
      );
    } catch {
      setHealthState("error");
      setHealthMessage(
        isSpanish
          ? "No pudimos revisar la configuracion del correo ahora."
          : "We could not check email configuration right now."
      );
    }
  };

  const copy =
    status === "success"
      ? {
          title: isSpanish ? "Correo verificado" : "Email verified",
          body: isSpanish
            ? "Tu correo fue confirmado correctamente. Ya puedes iniciar sesion y entrar a tu panel."
            : "Your email was confirmed successfully. You can sign in and enter your dashboard now.",
          tone: "text-emerald-600 dark:text-emerald-400",
        }
      : status === "expired"
        ? {
            title: isSpanish ? "Enlace vencido" : "Link expired",
            body: isSpanish
              ? "Este enlace ya vencio. Inicia sesion y solicita un nuevo correo de verificacion."
              : "This link has expired. Sign in and request a new verification email.",
            tone: "text-amber-600 dark:text-amber-400",
          }
        : status === "invalid"
          ? {
              title: isSpanish ? "Enlace invalido" : "Invalid link",
              body: isSpanish
                ? "El enlace de verificacion no es valido."
                : "That verification link is not valid.",
              tone: "text-rose-600 dark:text-rose-400",
            }
          : {
              title: isSpanish ? "No se pudo verificar" : "Verification failed",
              body: isSpanish
                ? "No pudimos completar la verificacion. Intentalo otra vez."
                : "We could not complete verification. Please try again.",
              tone: "text-rose-600 dark:text-rose-400",
            };

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-md flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-200">
            {isSpanish ? "Volver al inicio" : "Back to home"}
          </Link>
          <LanguageSelector compact />
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className={`mt-3 text-sm leading-7 ${copy.tone}`}>{copy.body}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-in?callbackUrl=/dashboard"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {isSpanish ? "Ir a iniciar sesion" : "Go to sign in"}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {isSpanish ? "Abrir panel" : "Open dashboard"}
            </Link>

            {canResend ? (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resendState === "loading"}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-700 disabled:opacity-60 dark:text-cyan-300"
              >
                {resendState === "loading"
                  ? isSpanish
                    ? "Reenviando..."
                    : "Resending..."
                  : isSpanish
                    ? "Reenviar correo"
                    : "Resend verification email"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void handleEmailHealthCheck()}
              disabled={healthState === "loading"}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              {healthState === "loading"
                ? isSpanish
                  ? "Revisando correo..."
                  : "Checking email..."
                : isSpanish
                  ? "Revisar configuracion de correo"
                  : "Check email setup"}
            </button>
          </div>

          {resendMessage ? (
            <p
              className={`mt-4 text-sm ${
                resendState === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {resendMessage}
            </p>
          ) : null}

          {healthMessage ? (
            <p
              className={`mt-2 text-sm ${
                healthState === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {healthMessage}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationInner />
    </Suspense>
  );
}
