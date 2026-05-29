"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import LanguageSelector from "@/components/language/LanguageSelector";
import { useLanguage } from "@/components/language/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function SignUpPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isSpanish = language === "es";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage(
        isSpanish ? "Las contrasenas no coinciden." : "Passwords do not match."
      );
      setLoading(false);
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setMessage(
        isSpanish
          ? "Debes aceptar los Terminos de Servicio y la Politica de Privacidad."
          : "You must accept the Terms of Service and Privacy Policy."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          language,
          acceptedTerms,
          acceptedPrivacy,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setMessage(
          data?.error ||
            data?.message ||
            (isSpanish ? "No se pudo crear la cuenta." : "Unable to create account.")
        );
        return;
      }

      if (response.headers.get("x-chimaura-verification-email") === "failed") {
        router.replace("/auth/confirmed?verified=error");
        return;
      }

      router.replace("/auth/confirmed?verified=success");
    } catch {
      setMessage(isSpanish ? "No se pudo crear la cuenta." : "Unable to create account.");
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.headline.signUp")}</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {isSpanish
              ? "Guarda tus sesiones, racha y preferencias de calma con una cuenta gratis."
              : "Save your sessions, streak, and calm preferences with a free account."}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isSpanish
              ? "Despues del registro te llevaremos a tu cuenta para verificar tu correo y telefono."
              : "After sign up, we'll take you to your account so you can verify your email and phone."}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isSpanish ? "Nombre" : "Name"}
              </label>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
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
                  minLength={8}
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isSpanish ? "Confirmar contrasena" : "Confirm password"}
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-11 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? (isSpanish ? "Ocultar contrasena" : "Hide password") : (isSpanish ? "Mostrar contrasena" : "Show password")}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {showConfirmPassword ? (
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

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded accent-violet-600"
                />
                <span>
                  {isSpanish ? "Acepto los " : "I agree to the "}
                  <Link href="/terms" target="_blank" className="font-semibold underline hover:text-slate-800 dark:hover:text-slate-200">
                    {isSpanish ? "Terminos de Servicio" : "Terms of Service"}
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded accent-violet-600"
                />
                <span>
                  {isSpanish ? "Acepto la " : "I agree to the "}
                  <Link href="/privacy" target="_blank" className="font-semibold underline hover:text-slate-800 dark:hover:text-slate-200">
                    {isSpanish ? "Politica de Privacidad" : "Privacy Policy"}
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms || !acceptedPrivacy}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {loading ? t("auth.cta.loading") : t("auth.cta.primarySignUp")}
            </button>

            {message ? <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p> : null}

            <p className="pt-2 text-xs text-slate-600 dark:text-slate-400">
              {isSpanish ? "Ya tienes cuenta?" : "Already have an account?"}{" "}
              <Link href="/sign-in" className="font-semibold underline">
                {isSpanish ? "Iniciar sesion" : "Sign in"}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
