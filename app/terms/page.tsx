import type { Metadata } from "next";
import Link from "next/link";

import { TERMS_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | Chimaura",
  description: "Terms and conditions governing your use of the Chimaura service.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] text-slate-900 dark:bg-neutral-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Back to home
        </Link>

        <div className="rounded-4xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-slate-900/90 dark:ring-white/10 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6C63FF]">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: {TERMS_LAST_UPDATED}</p>

          <div className="mt-10 max-w-none">
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using the Chimaura website, mobile application, or any related services (collectively,
                the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these
                Terms, do not use the Service. These Terms constitute a legally binding agreement between you and
                Chimaura (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                You must be at least 13 years of age to use the Service. By using the Service, you represent and warrant
                that you meet this requirement and that you have the legal capacity to enter into a binding agreement. If
                you are using the Service on behalf of an organization, you represent that you have the authority to bind
                that organization to these Terms.
              </p>
            </Section>

            <Section title="3. Account Registration">
            <p>
              To access certain features you may need to register for an account. You agree to provide accurate,
              current, and complete information and to keep it updated. You are solely responsible for safeguarding
              your account credentials and for all activity that occurs under your account. You must notify us
              immediately at{" "}
              <a className="text-[#6C63FF] underline" href="mailto:support@chimaura.com">
                support@chimaura.com
              </a>{" "}
              of any unauthorized access or security breach.
            </p>
            </Section>

            <Section title="4. Subscription & Payments">
            <p>
              Chimaura offers free and paid subscription plans. Paid plans are billed on the cycle you select
              (monthly or annual) via our third-party payment processor, Stripe. All fees are non-refundable except
              as expressly stated herein or required by applicable law.
            </p>
            <p>
              We reserve the right to modify pricing at any time. We will provide at least 30 days&apos; notice of any
              price changes via email or an in-app notification. Continued use of the Service after the price change
              takes effect constitutes your acceptance of the new pricing.
            </p>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current
              billing period — you will retain access to paid features until that date.
            </p>
            </Section>

            <Section title="5. Refund Policy">
            <p>
              All purchases are final and non-refundable. Exceptions may be made at our sole discretion in cases of
              billing errors or technical failures that prevented access to the Service. To request a refund, contact{" "}
              <a className="text-[#6C63FF] underline" href="mailto:support@chimaura.com">
                support@chimaura.com
              </a>{" "}
              within 7 days of the charge.
            </p>
            </Section>

            <Section title="6. Permitted Use">
            <p>You agree to use the Service only for lawful personal, non-commercial purposes. You agree not to:</p>
            <ul>
              <li>Copy, modify, distribute, sell, or lease any part of the Service;</li>
              <li>Reverse engineer, decompile, or attempt to extract source code;</li>
              <li>Use the Service to transmit harmful, offensive, or infringing content;</li>
              <li>Attempt to gain unauthorized access to any system or network;</li>
              <li>Use automated means (bots, scrapers) to access the Service without our express written permission;</li>
              <li>Use the Service in any way that violates applicable laws or regulations.</li>
            </ul>
            </Section>

            <Section title="7. AI-Generated Content Disclaimer">
            <p>
              Chimaura uses artificial intelligence to generate meditation scripts, voice narrations, and related
              content. This content is provided for general wellness and relaxation purposes only. It does not
              constitute medical advice, mental health treatment, or a substitute for professional care. Do not use
              the Service as a replacement for medical or psychiatric consultation or treatment.
            </p>
            <p>
              If you are experiencing a mental health crisis, please contact a licensed professional or call emergency
              services in your jurisdiction.
            </p>
            </Section>

            <Section title="8. Intellectual Property">
            <p>
              All content, features, and functionality of the Service — including but not limited to text, graphics,
              logos, audio, video, and AI-generated output — are owned by Chimaura or its licensors and are protected
              by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive,
              non-transferable license to access and use the Service for personal, non-commercial purposes.
            </p>
            </Section>

            <Section title="9. User Content">
            <p>
              If you submit content to the Service (e.g., journal entries, feedback), you grant Chimaura a
              worldwide, royalty-free, non-exclusive license to use, reproduce, and process such content solely for
              the purpose of providing and improving the Service. You represent that you own or have the necessary
              rights to submit such content and that it does not violate any third-party rights.
            </p>
            </Section>

            <Section title="10. Third-Party Services">
            <p>
              The Service may integrate with or link to third-party services (e.g., Stripe for payments, OpenAI for
              content generation). Your use of those services is governed by their respective terms and privacy
              policies. We are not responsible for the availability, accuracy, or practices of third-party services.
            </p>
            </Section>

            <Section title="11. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF
              VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            </Section>

            <Section title="12. Limitation of Liability">
            <p>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, CHIMAURA AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
              AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE
              OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL CUMULATIVE LIABILITY TO
              YOU SHALL NOT EXCEED THE GREATER OF $50 USD OR THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS
              PRECEDING THE CLAIM.
            </p>
            </Section>

            <Section title="13. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless Chimaura and its affiliates from and against any
              claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out
              of or in connection with your use of the Service, your violation of these Terms, or your violation of
              any third-party rights.
            </p>
            </Section>

            <Section title="14. Governing Law & Dispute Resolution">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              United States, without regard to its conflict-of-law principles. Any dispute arising under these Terms
              shall be resolved exclusively through binding arbitration administered by JAMS under its Streamlined
              Arbitration Rules. You waive any right to a jury trial or to participate in a class action. Nothing
              herein prevents either party from seeking injunctive relief in a court of competent jurisdiction.
            </p>
            </Section>

            <Section title="15. Termination">
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at any time, with
              or without notice, for conduct that we determine violates these Terms or is harmful to other users, us,
              third parties, or the integrity of the Service. Upon termination, your right to use the Service ceases
              immediately.
            </p>
            </Section>

            <Section title="16. Changes to These Terms">
            <p>
              We may revise these Terms at any time. Material changes will be communicated via email or a prominent
              in-app notice at least 14 days before taking effect. Your continued use of the Service after changes
              become effective constitutes your acceptance of the revised Terms.
            </p>
            </Section>

            <Section title="17. Contact">
            <p>
              Questions about these Terms? Contact us at:{" "}
              <a className="text-[#6C63FF] underline" href="mailto:legal@chimaura.com">
                legal@chimaura.com
              </a>
            </p>
            <p>
              See also our{" "}
              <Link className="text-[#6C63FF] underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{children}</div>
    </section>
  );
}
