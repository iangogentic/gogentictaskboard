"use client";

import { useState } from "react";
import { GlassTopBar } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import AgentSidePanel from "@/components/AgentSidePanel";
import { useTheme } from "@/lib/themes/provider";
import {
  THEMES,
  buildConic,
  buildRadial,
  buildGrid,
} from "@/lib/themes/constants";

export function GlassLayout({ children }: { children: React.ReactNode }) {
  const { theme, clarity, backgroundMode = "dark" } = useTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Build theme-driven background styles
  const A = THEMES[theme].a;
  const B = THEMES[theme].b;
  const conic = { backgroundImage: buildConic(A, B) };
  const radialA = { backgroundImage: buildRadial(B) };
  const radialB = { backgroundImage: buildRadial(A) };
  const gridStyle: React.CSSProperties = {
    backgroundImage: buildGrid(),
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
    WebkitMaskImage: "radial-gradient(80% 60% at 50% 40%, black, transparent)",
  };

  return (
    <>
      <style jsx>{`
        @keyframes gradientShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>

      <div className="relative min-h-screen text-white flex flex-row overflow-hidden">
        {/* Animated gradient background - switches between dark and light */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage:
              backgroundMode === "light"
                ? "linear-gradient(-45deg, #ffffff, #f5f5f5, #fafafa, #f0f0f0, #ffffff)"
                : "linear-gradient(-45deg, #000000, #0a0a0a, #050510, #000510, #000000)",
            backgroundSize: "400% 400%",
            animation: "gradientShift 15s ease infinite",
          }}
        />
        {/* Main content area */}
        <div className="flex-1 relative z-10">
          {/* Animated particle background */}
          <AnimatedBackground />

          {/* BACKGROUND (subtle theme-driven orbs on top of dark gradient) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-24 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
              style={{ ...conic, opacity: clarity ? 0.08 : 0.15 }}
            />
            <div
              className="absolute -bottom-48 -left-24 h-[40rem] w-[40rem] rounded-full blur-3xl"
              style={{ ...radialA, opacity: clarity ? 0.06 : 0.12 }}
            />
            <div
              className="absolute -bottom-20 -right-20 h-[36rem] w-[36rem] rounded-full blur-3xl"
              style={{ ...radialB, opacity: clarity ? 0.06 : 0.12 }}
            />
            <div
              className="absolute inset-0"
              style={{ ...gridStyle, opacity: clarity ? 0.05 : 0.08 }}
            />
            {clarity ? <div className="absolute inset-0 bg-black/60" /> : null}
          </div>

          <GlassTopBar onAIToggle={() => setIsPanelOpen(!isPanelOpen)} />
          <main className="relative z-10 pt-12">{children}</main>
        </div>

        {/* AI Agent Side Panel that pushes content */}
        <AgentSidePanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />
      </div>
    </>
  );
}
