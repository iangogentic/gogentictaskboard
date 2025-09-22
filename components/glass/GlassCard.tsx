"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";

interface GlassCardProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  clarity?: boolean;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  className = "",
  clarity = true,
  delay = 0,
  hover = true,
  glow = false,
  ...motionProps
}: GlassCardProps) {
  const pane = clarity
    ? "bg-black/40 border-white/30 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_20px_40px_rgba(0,0,0,.25)]"
    : "bg-black/30 border-white/20 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_10px_30px_rgba(0,0,0,.35)]";

  return (
    <motion.div
      className={`relative rounded-3xl border overflow-hidden transition-all duration-300 ${pane} ${className} ${
        glow
          ? "before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-r before:from-blue-500/20 before:via-purple-500/20 before:to-pink-500/20 before:blur-xl before:-z-10"
          : ""
      }`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.23, 1, 0.32, 1], // Smooth easing
      }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              y: -4,
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      {...motionProps}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0"
        whileHover={hover ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3 }}
        style={{
          background:
            "radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)",
        }}
      />
      {children}
    </motion.div>
  );
}
