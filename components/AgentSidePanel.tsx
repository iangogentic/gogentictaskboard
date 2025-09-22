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
      {/* Toggle Button - Minimal */}
      <motion.button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 p-2.5 backdrop-blur-xl border transition-all duration-300 rounded-l-xl ${
          clarity
            ? "bg-black/20 border-white/20 text-black/50 hover:text-black/70"
            : "bg-white/5 border-white/10 text-white/50 hover:text-white/70"
        }`}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI" : "Open AI"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Agent Panel - Minimal */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? "380px" : "0px",
          opacity: isOpen ? 1 : 0,
          x: isOpen ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="h-full overflow-hidden relative"
        style={{ minWidth: isOpen ? "380px" : "0px" }}
      >
        <div className="w-[380px] h-full flex flex-col relative">
          {/* Minimal glass background */}
          <div
            className={`absolute inset-0 ${
              clarity ? "bg-black/20" : "bg-white/[0.02]"
            }`}
          />
          <div className="absolute inset-0 backdrop-blur-xl" />

          {/* Content wrapper */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Minimal Header */}
            <div
              className={`p-4 flex items-center justify-between flex-shrink-0 border-b ${
                clarity ? "border-white/10" : "border-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare
                  className={`w-4 h-4 ${
                    clarity ? "text-black/40" : "text-white/40"
                  }`}
                />
                <span
                  className={`text-xs font-light ${
                    clarity ? "text-black/60" : "text-white/60"
                  }`}
                >
                  AI
                </span>
              </div>
              <button
                onClick={onToggle}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  clarity
                    ? "hover:bg-black/5 text-black/40 hover:text-black/60"
                    : "hover:bg-white/5 text-white/40 hover:text-white/60"
                }`}
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages Container - Minimal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p
                    className={`text-xs font-light ${
                      clarity ? "text-black/30" : "text-white/30"
                    }`}
                  >
                    Ask me anything
                  </p>
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
                      className={`max-w-[90%] px-3 py-2 rounded-xl text-xs ${
                        msg.role === "user"
                          ? clarity
                            ? "bg-black/10 text-black/70 ml-8"
                            : "bg-white/[0.07] text-white/70 ml-8"
                          : clarity
                            ? "bg-black/5 text-black/60 mr-8"
                            : "bg-white/[0.03] text-white/60 mr-8"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-light leading-relaxed">
                        {msg.content.length > 200
                          ? msg.content.substring(0, 200) + "..."
                          : msg.content}
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
                    className={`px-3 py-2 rounded-xl ${
                      clarity ? "bg-black/5" : "bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                          clarity ? "bg-black/30" : "bg-white/30"
                        }`}
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                          clarity ? "bg-black/30" : "bg-white/30"
                        }`}
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                          clarity ? "bg-black/30" : "bg-white/30"
                        }`}
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions - Icon only, minimal */}
            <div
              className={`px-4 py-2 border-t flex-shrink-0 ${
                clarity ? "border-white/10" : "border-white/5"
              }`}
            >
              <div className="flex justify-center gap-1">
                {quickActions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1 }}
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
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      clarity
                        ? "hover:bg-black/5 text-black/30 hover:text-black/50"
                        : "hover:bg-white/5 text-white/30 hover:text-white/50"
                    }`}
                    title={action.label}
                  >
                    <action.icon className="w-3.5 h-3.5" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Area - Minimal */}
            <div
              className={`p-3 border-t flex-shrink-0 ${
                clarity ? "border-white/10" : "border-white/5"
              }`}
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 text-sm ${
                    clarity
                      ? "bg-black/5 border border-white/10 text-black/70 placeholder-black/30 focus:bg-black/10 focus:border-white/20"
                      : "bg-white/[0.03] border border-white/5 text-white/70 placeholder-white/20 focus:bg-white/[0.05] focus:border-white/10"
                  }`}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-20 ${
                    clarity
                      ? "bg-black/10 hover:bg-black/15 text-black/40 hover:text-black/60"
                      : "bg-white/[0.05] hover:bg-white/[0.08] text-white/40 hover:text-white/60"
                  }`}
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
