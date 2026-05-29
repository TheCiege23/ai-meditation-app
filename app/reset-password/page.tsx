"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useLanguage } from "@/components/language/LanguageContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }

    setLoading(true);
    setSubmitted(false);
    setError("");

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          language,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            (isSpanish
              ? "No se pudo enviar el correo de restablecimiento."
              : "Unable to send reset email.")
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError(
        isSpanish
          ? "No se pudo enviar el correo de restablecimiento."
          : "Unable to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-md flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/sign-in")}
            className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300"
          >
            {isSpanish ? "Volver a iniciar sesion" : "Back to sign in"}
          </button>
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300">
            {isSpanish ? "Inicio" : "Home"}
          </Link>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {isSpanish ? "Restablecer contrasena" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {isSpanish
              ? "Introduce el correo asociado a tu cuenta y te enviaremos un enlace para crear una contrasena nueva."
              : "Enter the email address for your account and we'll send a link to create a new password."}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {isSpanish ? "Correo electronico" : "Email"}
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {loading
                ? isSpanish
                  ? "Enviando..."
                  : "Sending..."
                : isSpanish
                  ? "Enviar enlace de restablecimiento"
                  : "Send reset link"}
            </button>

            {submitted ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {isSpanish
                  ? "Si tu cuenta existe, recibiras un correo con los siguientes pasos."
                  : "If your account exists, you'll receive an email with the next steps."}
              </p>
            ) : null}

            {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
