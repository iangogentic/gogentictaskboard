"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Bot,
  Send,
  Loader2,
  Sparkles,
  Zap,
  Brain,
  Workflow,
  Clock,
  Search,
  ChevronLeft,
  MessageSquare,
  User,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/themes/provider";

interface AgentSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AgentSidePanel({
  isOpen,
  onToggle,
}: AgentSidePanelProps) {
  const { clarity } = useTheme();
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: Zap, label: "Tasks", action: "Show me all tasks" },
    { icon: Brain, label: "Overview", action: "Give me a site overview" },
    {
      icon: Workflow,
      label: "Projects",
      action: "Show me all active projects",
    },
    { icon: Clock, label: "Recent", action: "What are the most recent tasks?" },
    {
      icon: Search,
      label: "Search",
      action: "Search for documentation about the project",
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const projectId = window.location.pathname.includes("/projects/")
        ? window.location.pathname.split("/projects/")[1].split("/")[0]
        : undefined;

      // Prepare conversation history for the API
      const history = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Use the more powerful chat-v2 endpoint
      const response = await fetch("/api/agent/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          projectId,
          history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to get response");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "I couldn't process that request.",
        },
      ]);
    } catch (error) {
      console.error("Agent error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `❌ Error: ${error.message}`
              : "❌ Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Panel glass styling matching GlassCard
  const panelGlass = clarity
    ? "bg-black/40 border-white/30 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_20px_40px_rgba(0,0,0,.25)]"
    : "bg-black/30 border-white/20 backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_10px_30px_rgba(0,0,0,.35)]";

  // Text colors with proper contrast for readability
  const textPrimary = clarity ? "text-black/90" : "text-white/90";
  const textSecondary = clarity ? "text-black/70" : "text-white/70";
  const textMuted = clarity ? "text-black/50" : "text-white/50";
  const textSubtle = clarity ? "text-black/40" : "text-white/40";

  // Button styling
  const buttonGlass = clarity
    ? "bg-white/20 hover:bg-white/30 border-white/30"
    : "bg-white/10 hover:bg-white/20 border-white/20";

  return (
    <>
      {/* Toggle Button - Professional Glass Design */}
      <motion.button
        onClick={onToggle}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-2xl ${panelGlass} border transition-all duration-300 group`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`relative z-10 ${textSecondary}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.button>

      {/* AI Panel - Premium Glass Design */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed right-0 top-0 h-full z-40 w-[400px]"
          >
            <div
              className={`h-full rounded-l-3xl ${panelGlass} border-r-0 overflow-hidden`}
            >
              {/* Premium gradient overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5" />
              </div>

              {/* Content container */}
              <div className="relative h-full flex flex-col">
                {/* Header - Clean and Professional */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icon with gradient background */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-lg opacity-50" />
                        <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3
                          className={`text-base font-semibold ${textPrimary}`}
                        >
                          AI Assistant
                        </h3>
                        <p className={`text-xs ${textMuted}`}>
                          Powered by GPT-4
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onToggle}
                      className={`p-2 rounded-xl ${buttonGlass} border transition-all duration-200 ${textSecondary} hover:${textPrimary}`}
                      aria-label="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Container - Enhanced Design */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-6"
                    >
                      {/* Welcome animation */}
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30" />
                        <div
                          className={`relative p-4 rounded-3xl ${clarity ? "bg-white/10" : "bg-white/5"} backdrop-blur-xl border border-white/20`}
                        >
                          <Bot className={`w-12 h-12 ${textMuted}`} />
                        </div>
                      </motion.div>

                      <div className="text-center space-y-2">
                        <p className={`text-sm font-medium ${textPrimary}`}>
                          Hello! How can I assist you today?
                        </p>
                        <p className={`text-xs ${textMuted}`}>
                          Ask me about projects, tasks, or anything else
                        </p>
                      </div>

                      {/* Suggested prompts */}
                      <div className="w-full space-y-2">
                        <p className={`text-xs ${textSubtle} text-center mb-2`}>
                          Try asking:
                        </p>
                        {[
                          "What's my progress today?",
                          "Show recent updates",
                          "Help me with a task",
                        ].map((prompt, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setInput(prompt)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl ${clarity ? "bg-white/5 hover:bg-white/10" : "bg-white/[0.03] hover:bg-white/5"} border border-white/10 transition-all duration-200 group`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${textSecondary}`}>
                                {prompt}
                              </span>
                              <ArrowRight
                                className={`w-3 h-3 ${textSubtle} opacity-0 group-hover:opacity-100 transition-opacity`}
                              />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                                : clarity
                                  ? "bg-white/10"
                                  : "bg-white/5"
                            } backdrop-blur-xl border border-white/20`}
                          >
                            {msg.role === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className={`w-4 h-4 ${textSecondary}`} />
                            )}
                          </div>

                          {/* Message bubble */}
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30"
                                : clarity
                                  ? "bg-white/10 backdrop-blur-xl border border-white/20"
                                  : "bg-white/5 backdrop-blur-xl border border-white/10"
                            }`}
                          >
                            <p
                              className={`text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? textPrimary
                                  : textSecondary
                              }`}
                            >
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${clarity ? "bg-white/10" : "bg-white/5"} backdrop-blur-xl border border-white/20`}
                        >
                          <Bot className={`w-4 h-4 ${textSecondary}`} />
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl ${clarity ? "bg-white/10" : "bg-white/5"} backdrop-blur-xl border border-white/10`}
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Sparkles className={`w-4 h-4 ${textMuted}`} />
                            </motion.div>
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                  className={`w-2 h-2 rounded-full ${clarity ? "bg-black/40" : "bg-white/40"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions - Redesigned */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2 mb-3">
                    {quickActions.slice(0, 4).map((action, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setInput(action.action);
                          setTimeout(() => handleSend(), 100);
                        }}
                        className={`flex-1 p-2 rounded-xl ${buttonGlass} border backdrop-blur-xl transition-all duration-200 group`}
                        title={action.label}
                      >
                        <action.icon
                          className={`w-4 h-4 mx-auto ${textSecondary} group-hover:${textPrimary} transition-colors`}
                        />
                      </motion.button>
                    ))}
                  </div>

                  {/* Input Area - Premium Design */}
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !isLoading && handleSend()
                      }
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className={`w-full px-4 py-3 pr-12 rounded-2xl ${
                        clarity
                          ? "bg-white/20 border-white/30 text-black/90 placeholder-black/50"
                          : "bg-white/10 border-white/20 text-white/90 placeholder-white/50"
                      } backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center ${
                        isLoading || !input.trim()
                          ? "opacity-30 cursor-not-allowed"
                          : "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      } transition-all duration-200`}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
