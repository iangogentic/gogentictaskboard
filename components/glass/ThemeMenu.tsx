"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, Palette, Contrast } from "lucide-react";
import { useTheme } from "@/lib/themes/provider";
import { THEMES, ThemeName } from "@/lib/themes/constants";

export function ThemeMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme, clarity, setClarity } = useTheme();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={`rounded-xl p-2 border border-white/25 bg-white/10 hover:bg-white/15 transition ${focus} inline-flex items-center`}
      >
        <Menu className="h-5 w-5" />
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute left-1/2 -translate-x-1/2 mt-3 w-64 rounded-2xl border border-white/25 bg-black/60 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,.35)] z-30"
        >
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70">
            Quick Actions
          </div>
          <button
            className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus}`}
          >
            New Task
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus}`}
          >
            Quick Add
          </button>
          <div className="my-2 h-px bg-white/10" />

          {/* Clarity Toggle */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70 inline-flex items-center gap-2">
            <Contrast className="h-4 w-4" /> Display
          </div>
          <button
            onClick={() => setClarity(!clarity)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus} ${clarity ? "bg-white/15" : ""}`}
          >
            {clarity
              ? "High Contrast (Current)"
              : "Standard Contrast (Current)"}
          </button>

          <div className="my-2 h-px bg-white/10" />

          {/* Theme Selection */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70 inline-flex items-center gap-2">
            <Palette className="h-4 w-4" /> Themes
          </div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {(Object.keys(THEMES) as ThemeName[]).map((name) => (
              <button
                key={name}
                onClick={() => {
                  setTheme(name);
                  setMenuOpen(false);
                }}
                className={`rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10 ${focus} ${
                  theme === name ? "bg-white/15" : ""
                }`}
              >
                {name.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
