"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full bg-white/15 text-white/90 border border-white/25 ${className}`}
    >
      {children}
    </span>
  );
}
