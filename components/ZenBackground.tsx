"use client";

import { useEffect, useRef } from "react";
import type { BreathingTheme } from "@/components/BreathingCircle";

type Props = {
  theme: BreathingTheme;
  isActive: boolean;
  darkMode?: boolean;
};

export default function ZenBackground({ theme, isActive, darkMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Leaf particles for forest theme
    const leafParticles = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 1000,
      y: Math.random() * 800,
      vx: 0.2 + Math.random() * 0.4,
      vy: -0.3 - Math.random() * 0.5,
      size: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.02,
      seed: i,
    }));

    // Stars for night theme
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      r: 0.5 + Math.random() * 1.5,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const drawMist = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (darkMode) {
        bg.addColorStop(0, "#0f172a");
        bg.addColorStop(1, "#1e293b");
      } else {
        bg.addColorStop(0, "#f0f9ff");
        bg.addColorStop(1, "#dbeafe");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const orbs = [
        { x: 0.3, y: 0.25, r: 0.18, a: 0.07 },
        { x: 0.7, y: 0.4, r: 0.22, a: 0.06 },
        { x: 0.5, y: 0.7, r: 0.15, a: 0.05 },
      ];
      for (const orb of orbs) {
        const ox = orb.x * w + Math.sin(t * 0.0004 + orb.r * 10) * 30;
        const oy = orb.y * h + Math.cos(t * 0.0003 + orb.r * 8) * 20;
        const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * w);
        gr.addColorStop(0, darkMode ? `rgba(147,197,253,${orb.a})` : `rgba(186,230,253,${orb.a + 0.04})`);
        gr.addColorStop(1, "transparent");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      }
      for (let i = 0; i < 18; i++) {
        const x = ((i * 173 + t * 0.015) % w + w) % w;
        const y = ((i * 97 + Math.sin(t * 0.0005 + i) * 60) % h + h) % h;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + Math.sin(t * 0.001 + i) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = darkMode ? "rgba(147,197,253,0.25)" : "rgba(125,211,252,0.35)";
        ctx.fill();
      }
    };

    const drawSunrise = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (darkMode) {
        bg.addColorStop(0, "#1c0a00");
        bg.addColorStop(0.5, "#431407");
        bg.addColorStop(1, "#7c2d12");
      } else {
        bg.addColorStop(0, "#fff7ed");
        bg.addColorStop(0.5, "#ffedd5");
        bg.addColorStop(1, "#fde68a");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const sunX = w * 0.5;
      const sunY = h * 0.38 + Math.sin(t * 0.0003) * 8;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.42);
      sunGlow.addColorStop(0, darkMode ? "rgba(251,146,60,0.35)" : "rgba(253,186,116,0.45)");
      sunGlow.addColorStop(0.4, darkMode ? "rgba(251,146,60,0.12)" : "rgba(254,215,170,0.2)");
      sunGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.0002;
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(angle);
        const rayGrad = ctx.createLinearGradient(0, 0, w * 0.45, 0);
        rayGrad.addColorStop(0, darkMode ? "rgba(251,146,60,0.08)" : "rgba(254,215,170,0.12)");
        rayGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(w * 0.45, -22);
        ctx.lineTo(w * 0.45, 22);
        ctx.lineTo(0, 6);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawForest = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (darkMode) {
        bg.addColorStop(0, "#052e16");
        bg.addColorStop(1, "#14532d");
      } else {
        bg.addColorStop(0, "#ecfdf5");
        bg.addColorStop(1, "#bbf7d0");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        const bx = w * (0.15 + i * 0.18) + Math.sin(t * 0.0002 + i) * 20;
        const beamGrad = ctx.createLinearGradient(bx, 0, bx + 60, h);
        beamGrad.addColorStop(0, darkMode ? "rgba(134,239,172,0.04)" : "rgba(187,247,208,0.1)");
        beamGrad.addColorStop(0.5, darkMode ? "rgba(134,239,172,0.07)" : "rgba(187,247,208,0.15)");
        beamGrad.addColorStop(1, "transparent");
        ctx.fillStyle = beamGrad;
        ctx.save();
        ctx.transform(1, 0, 0.3, 1, 0, 0);
        ctx.fillRect(bx - 20, 0, 55, h);
        ctx.restore();
      }
      for (const leaf of leafParticles) {
        leaf.x = (leaf.x + leaf.vx * (isActive ? 1.4 : 0.6) + 1000) % 1000;
        leaf.y = ((leaf.y + leaf.vy * (isActive ? 1.2 : 0.5)) % 800 + 800) % 800;
        leaf.rot += leaf.rotV;
        ctx.save();
        ctx.translate(leaf.x * (w / 1000), leaf.y * (h / 800));
        ctx.rotate(leaf.rot + Math.sin(t * 0.0003 + leaf.seed) * 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = darkMode ? "rgba(134,239,172,0.3)" : "rgba(74,222,128,0.35)";
        ctx.fill();
        ctx.restore();
      }
    };

    const drawNight = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(0.5, "#0f172a");
      bg.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (const star of stars) {
        const alpha = 0.4 + Math.sin(t * 0.001 + star.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,232,240,${alpha})`;
        ctx.fill();
      }
      const moonX = w * 0.78;
      const moonY = h * 0.14 + Math.sin(t * 0.0002) * 5;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
      moonGlow.addColorStop(0, "rgba(226,232,240,0.18)");
      moonGlow.addColorStop(0.4, "rgba(148,163,184,0.07)");
      moonGlow.addColorStop(1, "transparent");
      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const auroraY = h * (0.3 + i * 0.08) + Math.sin(t * 0.0004 + i * 1.5) * 30;
        const auroraGrad = ctx.createLinearGradient(0, auroraY - 30, 0, auroraY + 30);
        const colors = ["rgba(99,102,241,", "rgba(139,92,246,", "rgba(59,130,246,"];
        auroraGrad.addColorStop(0, "transparent");
        auroraGrad.addColorStop(0.5, `${colors[i]}0.08)`);
        auroraGrad.addColorStop(1, "transparent");
        ctx.fillStyle = auroraGrad;
        ctx.beginPath();
        ctx.moveTo(0, auroraY);
        for (let x = 0; x <= w; x += 40) {
          ctx.lineTo(x, auroraY + Math.sin(x * 0.008 + t * 0.0005 + i) * 18);
        }
        ctx.lineTo(w, auroraY + 40);
        ctx.lineTo(0, auroraY + 40);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawMap: Record<BreathingTheme, (t: number) => void> = {
      mist: drawMist,
      sunrise: drawSunrise,
      forest: drawForest,
      night: drawNight,
    };

    const draw = drawMap[theme] ?? drawMist;

    const loop = (timestamp: number) => {
      draw(timestamp);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [theme, isActive, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
