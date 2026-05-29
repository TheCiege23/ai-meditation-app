"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const fieldClass =
    "mt-1 w-full rounded-2xl border border-[#E1DFD9] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/15 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-100 dark:focus:border-[#6C63FF] dark:focus:ring-[#6C63FF]/20";

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-slate-900 dark:bg-neutral-950 dark:text-slate-100">
      <div className="mx-auto max-w-xl px-5 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Back to home
        </Link>

        <div className="rounded-4xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-slate-900/90 dark:ring-white/10 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6C63FF]">Support</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            We typically respond within 1–2 business days. For account or billing issues, please include the email
            address associated with your account.
          </p>

          {status === "sent" ? (
          <div className="mt-10 rounded-3xl bg-[#EEF0FF] p-8 text-center dark:bg-violet-950">
            <p className="text-2xl">✓</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Message sent</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Thanks for reaching out. We&apos;ll get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: "", message: "" }); }}
              className="mt-6 rounded-full bg-[#6C63FF] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Send another message
            </button>
          </div>
          ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="subject">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select a topic…</option>
                <option value="billing">Billing & subscription</option>
                <option value="account">Account access</option>
                <option value="bug">Report a bug</option>
                <option value="feedback">Product feedback</option>
                <option value="privacy">Privacy request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="How can we help?"
                value={form.message}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            {status === "error" && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                Something went wrong. Please try again or email us directly at{" "}
                <a className="underline" href="mailto:support@chimaura.com">support@chimaura.com</a>.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-2xl bg-linear-to-r from-[#6C63FF] to-[#A5B4FC] py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>

            <p className="text-center text-xs text-slate-400">
              By submitting this form you agree to our{" "}
              <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
            </p>
          </form>
          )}

          <div className="mt-16 border-t border-[#E1DFD9] pt-8 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Direct email</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>General support: <a className="text-[#6C63FF] underline" href="mailto:support@chimaura.com">support@chimaura.com</a></p>
            <p>Billing: <a className="text-[#6C63FF] underline" href="mailto:billing@chimaura.com">billing@chimaura.com</a></p>
            <p>Privacy requests: <a className="text-[#6C63FF] underline" href="mailto:privacy@chimaura.com">privacy@chimaura.com</a></p>
            <p>Legal: <a className="text-[#6C63FF] underline" href="mailto:legal@chimaura.com">legal@chimaura.com</a></p>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
