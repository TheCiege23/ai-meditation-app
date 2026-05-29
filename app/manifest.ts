import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChimAura — Guided Calm",
    short_name: "ChimAura",
    description: "AI-powered meditation, breathwork, sleep, and cosmic reflection.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    background_color: "#07111f",
    theme_color: "#07111f",
    categories: ["health", "lifestyle", "mindfulness"],
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "384x384", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/chimaura-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
