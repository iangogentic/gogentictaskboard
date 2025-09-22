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
  Minimize2,
  Maximize2,
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

  return (
    <>
      {/* Toggle Button - Fixed on Right Side of Screen */}
      <motion.button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 p-3 backdrop-blur-2xl border shadow-2xl transition-all duration-300 rounded-l-2xl ${
          clarity
            ? "bg-black/40 border-white/30 text-black/70 hover:bg-black/50 hover:text-black/90"
            : "bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:text-white/90"
        }`}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI" : "Open AI"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          {!isOpen && <MessageSquare className="w-5 h-5" />}
        </motion.div>
      </motion.button>

      {/* Agent Panel - This will be in the flex flow */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? "420px" : "0px",
          opacity: isOpen ? 1 : 0,
          x: isOpen ? 0 : 20,
        }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="h-full overflow-hidden relative"
        style={{ minWidth: isOpen ? "420px" : "0px" }}
      >
        <div className="w-[420px] h-full flex flex-col relative">
          {/* Enhanced glass background with gradient */}
          <div
            className={`absolute inset-0 ${
              clarity
                ? "bg-gradient-to-b from-black/30 via-black/20 to-black/30"
                : "bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-white/[0.05]"
            }`}
          />
          <div className="absolute inset-0 backdrop-blur-2xl" />

          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/5 to-transparent" />
          </div>

          {/* Content wrapper */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Enhanced Header with gradient */}
            <div
              className={`p-5 flex items-center justify-between flex-shrink-0 border-b ${
                clarity ? "border-white/20" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    clarity ? "bg-white/20" : "bg-white/10"
                  }`}
                >
                  <Sparkles
                    className={`w-5 h-5 ${
                      clarity ? "text-black/70" : "text-white/70"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`text-sm font-semibold ${
                      clarity ? "text-black/90" : "text-white/90"
                    }`}
                  >
                    AI Assistant
                  </h3>
                  <p
                    className={`text-xs ${
                      clarity ? "text-black/50" : "text-white/50"
                    }`}
                  >
                    Powered by GPT-4
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  clarity
                    ? "hover:bg-black/10 text-black/50 hover:text-black/70"
                    : "hover:bg-white/10 text-white/50 hover:text-white/70"
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Container - Enhanced */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div
                    className={`p-4 rounded-2xl ${
                      clarity ? "bg-white/10" : "bg-white/5"
                    }`}
                  >
                    <Bot
                      className={`w-12 h-12 ${
                        clarity ? "text-black/30" : "text-white/30"
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-medium mb-2 ${
                        clarity ? "text-black/70" : "text-white/70"
                      }`}
                    >
                      How can I help you today?
                    </p>
                    <p
                      className={`text-xs ${
                        clarity ? "text-black/40" : "text-white/40"
                      }`}
                    >
                      Ask me about projects, tasks, or anything else
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                        msg.role === "user"
                          ? clarity
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-black/80 ml-auto border border-purple-500/20"
                            : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white/90 ml-auto border border-purple-500/30"
                          : clarity
                            ? "bg-white/20 text-black/70 mr-auto border border-white/20"
                            : "bg-white/10 text-white/80 mr-auto border border-white/10"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
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
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      clarity ? "bg-white/20" : "bg-white/10"
                    }`}
                  >
                    <div className="flex gap-1.5 items-center">
                      <Sparkles
                        className={`w-4 h-4 animate-pulse ${
                          clarity ? "text-purple-700" : "text-purple-400"
                        }`}
                      />
                      <div className="flex gap-1">
                        <span
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            clarity ? "bg-black/40" : "bg-white/40"
                          }`}
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            clarity ? "bg-black/40" : "bg-white/40"
                          }`}
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            clarity ? "bg-black/40" : "bg-white/40"
                          }`}
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions - Enhanced with labels */}
            <div
              className={`px-5 py-3 border-t flex-shrink-0 ${
                clarity ? "border-white/20" : "border-white/10"
              }`}
            >
              <div className="flex gap-2 flex-wrap">
                {quickActions.slice(0, 4).map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      setInput(action.action);
                      setTimeout(() => {
                        document
                          .querySelector<HTMLButtonElement>(
                            'button[aria-label="Send"]'
                          )
                          ?.click();
                      }, 100);
                    }}
                    className={`flex-1 min-w-[80px] p-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                      clarity
                        ? "bg-white/10 hover:bg-white/20 text-black/50 hover:text-black/70 border border-white/20"
                        : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 border border-white/10"
                    }`}
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Area - Enhanced */}
            <div
              className={`p-4 border-t flex-shrink-0 ${
                clarity
                  ? "border-white/20 bg-black/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className={`flex-1 px-4 py-3 rounded-xl focus:outline-none transition-all duration-200 text-sm ${
                    clarity
                      ? "bg-white/20 border border-white/30 text-black/80 placeholder-black/40 focus:bg-white/30 focus:border-white/40"
                      : "bg-white/10 border border-white/20 text-white/90 placeholder-white/40 focus:bg-white/15 focus:border-white/30"
                  }`}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`p-3 rounded-xl transition-all duration-200 disabled:opacity-30 ${
                    clarity
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  }`}
                  aria-label="Send"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
