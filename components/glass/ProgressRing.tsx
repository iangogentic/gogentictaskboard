"use client";

import React from "react";

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}

export function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  className = "",
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className={`-rotate-90 ${className}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className="fill-none stroke-white/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeLinecap="round"
        className="fill-none stroke-white/90 drop-shadow-[0_0_14px_rgba(255,255,255,.45)]"
        style={{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
}
