"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GlassButtonProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function GlassButton({
  children,
  className = "",
  size = "md",
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  onClick,
  type = "button",
  ...motionProps
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "bg-white/[0.05] hover:bg-white/[0.08] border-white/10 hover:border-white/20",
    secondary:
      "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10",
    ghost:
      "bg-transparent hover:bg-white/[0.03] border-transparent hover:border-white/5",
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-xl border
        backdrop-blur-xl transition-all duration-200
        text-white/90 font-medium tracking-wide
        focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              transition: { duration: 0.1, ease: "easeOut" },
            }
          : undefined
      }
      whileTap={
        !isDisabled
          ? {
              scale: 0.98,
              transition: { duration: 0.1, ease: "easeOut" },
            }
          : undefined
      }
      {...motionProps}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.05] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />

      {/* Loading spinner */}
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}

      {/* Left icon */}
      {!loading && icon && iconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Content */}
      <span className="relative">{children}</span>

      {/* Right icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
}
