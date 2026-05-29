import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdminDock from "@/components/shared/AdminDock";
import { LanguageProvider } from "@/components/language/LanguageContext";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import InstallBanner from "@/components/pwa/InstallBanner";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import BottomNav from "@/components/app/BottomNav";
import UniversalDeepLTranslator from "@/components/language/UniversalDeepLTranslator";
import { SubscriptionPromptProvider } from "@/components/billing/SubscriptionPromptProvider";
import ThemeModeToggle from "@/components/shared/ThemeModeToggle";

export const metadata: Metadata = {
  metadataBase: new URL("https://chimaura.com"),
  applicationName: "ChimAura",
  title: {
    default: "ChimAura – Guided meditation, breathing, and daily reflection",
    template: "%s | ChimAura",
  },
  description:
    "ChimAura is a calm online space for guided meditation, breathing exercises, mindfulness sessions, sleep meditations, and daily reflection.",
  alternates: {
    canonical: "https://chimaura.com",
  },
  icons: {
    icon: [
      { url: "/chimaura-mark.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: ["/chimaura-mark.png"],
  },
  openGraph: {
    title: "ChimAura – Guided meditation & breathing app",
    description:
      "Create calm guided meditation, breathing exercises, and daily spiritual reflection with ChimAura’s AI-powered mindfulness tools.",
    url: "https://chimaura.com",
    siteName: "ChimAura",
    images: [
      {
        url: "/chimaura-logo.png",
        width: 1200,
        height: 1200,
        alt: "ChimAura logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChimAura – Guided meditation & breathing app",
    description:
      "Online guided meditation, breathing for anxiety, calm sessions, and daily reflection in one mindful space.",
    images: ["/chimaura-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChimAura",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ChimAura",
    url: "https://chimaura.com",
    description:
      "ChimAura is a calm online space for guided meditation, breathing exercises, mindfulness sessions, and daily reflection.",
  };

  return (
    <html lang="en">
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('chimaura.theme');var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(t==='dark'?'dark':'light');}catch(e){}})();",
          }}
        />
        <AdminDock />
        <LanguageProvider>
          <SubscriptionPromptProvider>
            <UniversalDeepLTranslator />
            <PWAProvider>
              {children}
              <InstallBanner />
              <OfflineBanner />
            </PWAProvider>
            <ThemeModeToggle />
          </SubscriptionPromptProvider>
        </LanguageProvider>
        <BottomNav />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
