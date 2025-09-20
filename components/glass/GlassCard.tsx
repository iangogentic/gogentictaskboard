"use client";

import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  clarity?: boolean;
}

export function GlassCard({
  children,
  className = "",
  clarity = true,
}: GlassCardProps) {
  const pane = clarity
    ? "bg-white/14 border-white/30 backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_10px_30px_rgba(0,0,0,.15)]"
    : "bg-black/25 border-white/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.12)]";

  return (
    <div
      className={`relative rounded-3xl border overflow-hidden ${pane} ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/60 via-white/20 to-white/60" />
      {children}
    </div>
  );
}
