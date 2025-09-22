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
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/themes/provider";
import { useUser } from "@/lib/user-context";
import { useSession } from "next-auth/react";

interface AgentSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AgentSidePanel({
  isOpen,
  onToggle,
}: AgentSidePanelProps) {
  const { clarity } = useTheme();
  const { currentUser } = useUser();
  const { data: session } = useSession();
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

  // Load previous conversation on mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem("currentConversationId");
    if (savedConversationId) {
      setConversationId(savedConversationId);
      // Optionally load conversation history from API
      loadConversationHistory(savedConversationId);
    }
  }, []);

  const loadConversationHistory = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    localStorage.removeItem("currentConversationId");
  };

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

      // Use the more powerful chat-v2 endpoint with conversation persistence
      const response = await fetch("/api/agent/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          projectId,
          history,
          conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to get response");
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem("currentConversationId", data.conversationId);
      }

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
      {/* Toggle Button - Glass */}
      <motion.button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 p-3 backdrop-blur-2xl border transition-all duration-300 rounded-l-2xl shadow-xl ${
          clarity
            ? "bg-black/40 border-white/30 text-black/60 hover:text-black/80 hover:bg-black/50"
            : "bg-white/10 border-white/20 text-white/60 hover:text-white/80 hover:bg-white/15"
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
          {/* High quality glass background */}
          <div
            className={`absolute inset-0 ${
              clarity
                ? "bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_20px_40px_rgba(0,0,0,.25)]"
                : "bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_10px_30px_rgba(0,0,0,.35)]"
            }`}
          />
          <div className="absolute inset-0 backdrop-blur-2xl" />

          {/* Top highlight line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* Content wrapper */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Glass Header with Conversation Controls */}
            <div
              className={`p-4 flex items-center justify-between flex-shrink-0 border-b ${
                clarity ? "border-white/20" : "border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    clarity ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <MessageSquare
                    className={`w-3.5 h-3.5 ${
                      clarity ? "text-black/60" : "text-white/60"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${
                    clarity ? "text-black/70" : "text-white/70"
                  }`}
                >
                  AI Assistant
                </span>
                {conversationId && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg backdrop-blur-sm ${
                      clarity
                        ? "bg-white/10 text-black/40"
                        : "bg-white/5 text-white/30"
                    }`}
                  >
                    Session Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {conversationId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startNewConversation}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      clarity
                        ? "hover:bg-white/10 text-black/50 hover:text-black/70"
                        : "hover:bg-white/5 text-white/50 hover:text-white/70"
                    }`}
                    aria-label="New Conversation"
                    title="Start New Conversation"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                )}
                <button
                  onClick={onToggle}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    clarity
                      ? "hover:bg-white/10 text-black/50 hover:text-black/70"
                      : "hover:bg-white/5 text-white/50 hover:text-white/70"
                  }`}
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages Container - Glass */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      clarity ? "bg-white/10" : "bg-white/5"
                    }`}
                  >
                    <Bot
                      className={`w-8 h-8 ${
                        clarity ? "text-black/30" : "text-white/30"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs ${
                      clarity ? "text-black/50" : "text-white/50"
                    }`}
                  >
                    How can I help you today?
                  </p>
                  {conversationId && (
                    <p
                      className={`text-xs ${
                        clarity ? "text-black/40" : "text-white/40"
                      }`}
                    >
                      Continuing session...
                    </p>
                  )}
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
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs backdrop-blur-md border ${
                        msg.role === "user"
                          ? clarity
                            ? "bg-black/20 border-white/20 text-black/80 ml-auto shadow-lg"
                            : "bg-white/10 border-white/15 text-white/80 ml-auto shadow-lg"
                          : clarity
                            ? "bg-white/15 border-white/15 text-black/70 mr-auto"
                            : "bg-white/5 border-white/10 text-white/70 mr-auto"
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
                    className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border ${
                      clarity
                        ? "bg-white/15 border-white/15"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex gap-1.5 items-center">
                      <div className="flex gap-1">
                        <span
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            clarity ? "bg-black/40" : "bg-white/40"
                          }`}
                        ></span>
                        <span
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            clarity ? "bg-black/40" : "bg-white/40"
                          }`}
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className={`w-2 h-2 rounded-full animate-pulse ${
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

            {/* Quick Actions - Glass buttons */}
            <div
              className={`px-4 py-3 border-t flex-shrink-0 ${
                clarity ? "border-white/20" : "border-white/10"
              }`}
            >
              <div className="flex justify-center gap-2">
                {quickActions.slice(0, 5).map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05, y: -1 }}
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
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all duration-200 ${
                      clarity
                        ? "bg-white/10 border-white/15 hover:bg-white/15 text-black/50 hover:text-black/70"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/50 hover:text-white/70"
                    }`}
                    title={action.label}
                  >
                    <action.icon className="w-3.5 h-3.5" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Area - Glass */}
            <div
              className={`p-3.5 border-t flex-shrink-0 ${
                clarity
                  ? "border-white/20 bg-black/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl backdrop-blur-md focus:outline-none transition-all duration-200 text-sm border ${
                    clarity
                      ? "bg-white/15 border-white/20 text-black/80 placeholder-black/40 focus:bg-white/20 focus:border-white/30"
                      : "bg-white/5 border-white/10 text-white/80 placeholder-white/30 focus:bg-white/10 focus:border-white/20"
                  }`}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all duration-200 disabled:opacity-30 ${
                    clarity
                      ? "bg-white/15 border-white/20 hover:bg-white/20 text-black/60 hover:text-black/80"
                      : "bg-white/10 border-white/15 hover:bg-white/15 text-white/60 hover:text-white/80"
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
