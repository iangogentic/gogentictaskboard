"use client";

import { motion } from "framer-motion";

export function LoadingFallback({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        className="flex items-center gap-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
        <span className="text-white/70">{message}</span>
      </motion.div>
    </div>
  );
}
