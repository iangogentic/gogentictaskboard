"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  containerClassName?: string;
  glow?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      icon,
      iconPosition = "left",
      className = "",
      containerClassName = "",
      glow = false,
      ...props
    },
    ref
  ) => {
    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <motion.div
        className={`relative ${containerClassName}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/70 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative group">
          {/* Glow effect */}
          {glow && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          )}

          {/* Input wrapper */}
          <div className="relative">
            {/* Left icon */}
            {icon && iconPosition === "left" && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 pointer-events-none">
                {icon}
              </div>
            )}

            {/* Input field */}
            <input
              ref={ref}
              id={inputId}
              className={`
              w-full px-4 py-3 rounded-xl border
              bg-white/[0.03] border-white/5
              text-white/90 placeholder-white/20
              backdrop-blur-xl
              transition-all duration-200
              focus:outline-none focus:bg-white/[0.05] focus:border-white/10
              focus:ring-2 focus:ring-white/10 focus:ring-offset-2 focus:ring-offset-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon && iconPosition === "left" ? "pl-10" : ""}
              ${icon && iconPosition === "right" ? "pr-10" : ""}
              ${error ? "border-red-400/50 focus:border-red-400/70" : ""}
              ${className}
            `}
              {...props}
            />

            {/* Right icon */}
            {icon && iconPosition === "right" && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 pointer-events-none">
                {icon}
              </div>
            )}

            {/* Focus highlight */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            className="mt-2 text-sm text-red-400/80"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
