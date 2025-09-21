"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentChatButtonProps {
  onClick: () => void;
}

export function AgentChatButton({ onClick }: AgentChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render with animations until client-side mounted
  if (!isMounted) {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:bg-white/15 transition-all duration-300"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20" />
      </button>
    );
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:bg-white/15 transition-all duration-300 relative overflow-hidden"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-6 w-6 relative z-10" />
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-sm" />
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-16 whitespace-nowrap rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-2 text-sm text-white shadow-lg"
          >
            AI Assistant
            <div className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white/10 backdrop-blur-xl border-r border-t border-white/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
