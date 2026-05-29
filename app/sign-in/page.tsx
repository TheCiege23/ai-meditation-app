"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import LanguageSelector from "@/components/language/LanguageSelector";
import { useLanguage } from "@/components/language/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

function getVerificationMessage(status: string | null, isSpanish: boolean) {
  switch (status) {
    case "success":
      return isSpanish
        ? "Tu correo ya esta verificado. Ya puedes iniciar sesion."
        : "Your email is verified. You can sign in now.";
    case "expired":
      return isSpanish
        ? "Este enlace de verificacion ya vencio. Solicita uno nuevo desde tu cuenta."
        : "This verification link has expired. Request a new one from your account.";
    case "invalid":
      return isSpanish
        ? "Este enlace de verificacion no es valido."
        : "That verification link is not valid.";
    case "error":
      return isSpanish
        ? "No se pudo completar la verificacion. Intentalo de nuevo."
        : "We couldn't complete verification. Please try again.";
    default:
      return "";
  }
}

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isSpanish = language === "es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const verificationStatus = searchParams.get("verified");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const accountMessage = searchParams.get("verification");
  const queryMessage = useMemo(() => {
    if (accountMessage === "sent") {
      return isSpanish
        ? "Te enviamos un correo de verificacion. Revisa tu bandeja de entrada."
        : "We sent you a verification email. Check your inbox.";
    }

    if (accountMessage === "email-pending") {
      return isSpanish
        ? "Tu cuenta fue creada, pero no pudimos enviar el correo de verificacion. Solicita uno nuevo desde tu cuenta."
        : "Your account was created, but we could not send the verification email. Request a new one from your account.";
    }

    return getVerificationMessage(verificationStatus, isSpanish);
  }, [accountMessage, verificationStatus, isSpanish]);
  const feedbackMessage = message || queryMessage;
  const feedbackClass =
    message ||
    verificationStatus === "expired" ||
    verificationStatus === "invalid" ||
    verificationStatus === "error" ||
    accountMessage === "email-pending"
      ? "text-sm text-rose-600 dark:text-rose-400"
      : "text-sm text-emerald-600 dark:text-emerald-400";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setMessage(
          data?.error ||
            data?.message ||
            (isSpanish ? "No se pudo iniciar sesion." : "Unable to sign in.")
        );
        return;
      }

      router.replace(callbackUrl || "/dashboard");
    } catch {
      setMessage(isSpanish ? "No se pudo iniciar sesion." : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "x-chimaura-language": language,
        },
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(
          data?.error ||
            (isSpanish
              ? "No se pudo reenviar la verificacion."
              : "Unable to resend verification.")
        );
        return;
      }

      setMessage(
        isSpanish
          ? "Te enviamos un nuevo correo de verificacion."
          : "We sent you a new verification email."
      );
    } catch {
      setMessage(
        isSpanish
          ? "No se pudo reenviar la verificacion."
          : "Unable to resend verification."
      );
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.headline.signIn")}</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {isSpanish
              ? "Accede a tus sesiones guardadas, tu racha y tu plan premium."
              : "Access your saved sessions, streak, and premium plan."}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isSpanish ? "Contrasena" : "Password"}
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-11 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? (isSpanish ? "Ocultar contrasena" : "Hide password") : (isSpanish ? "Mostrar contrasena" : "Show password")}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6c2.1 0 3.9.6 5.4 1.5M22 12s-3.5 6-10 6c-2.1 0-3.9-.6-5.4-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                {loading ? t("auth.cta.loading") : t("auth.cta.primarySignIn")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-xs font-semibold text-slate-600 underline dark:text-slate-300"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>

            {!feedbackMessage && !loading ? null : null}

            {feedbackMessage ? <p className={feedbackClass}>{feedbackMessage}</p> : null}

            {verificationStatus === "expired" ||
            verificationStatus === "invalid" ||
            verificationStatus === "error" ? (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="text-xs font-semibold text-slate-600 underline dark:text-slate-300"
              >
                {isSpanish ? "Reenviar verificacion" : "Resend verification"}
              </button>
            ) : null}

            <p className="pt-2 text-xs text-slate-600 dark:text-slate-400">
              {isSpanish ? "No tienes cuenta?" : "Don't have an account?"}{" "}
              <Link href="/sign-up" className="font-semibold underline">
                {isSpanish ? "Crear cuenta gratis" : "Create a free account"}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageInner />
    </Suspense>
  );
}
