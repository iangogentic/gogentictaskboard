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
  BarChart3,
} from "lucide-react";

export default function AgentPanel() {
  const [isOpen, setIsOpen] = useState(false);
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
    { icon: Zap, label: "List Tasks", action: "list all tasks" },
    { icon: Brain, label: "Analyze Project", action: "analyze project health" },
    {
      icon: Workflow,
      label: "Run Workflow",
      action: "execute daily standup workflow",
    },
    { icon: Clock, label: "Schedule Task", action: "schedule weekly report" },
    {
      icon: BarChart3,
      label: "Generate Report",
      action: "generate progress report",
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Get current project ID from URL if available
      const projectId = window.location.pathname.includes("/projects/")
        ? window.location.pathname.split("/projects/")[1].split("/")[0]
        : undefined;

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          projectId,
          conversationId, // Send conversation ID to maintain context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Save conversation ID for maintaining context
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error("Agent error:", error);

      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "❌ Sorry, I encountered an error. Please try again or check if you're logged in.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Agent Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${isOpen ? "hidden" : "block"}`}
        aria-label="Open Agent"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </button>

      {/* Agent Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">Operations Agent</h2>
              <p className="text-xs opacity-90">AI-Powered Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sprint Features Badge */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-3 border-b">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Sprint 1-6 Features Active
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {["RBAC", "Slack", "Drive", "RAG", "Workflows", "Analytics"].map(
              (feature) => (
                <span
                  key={feature}
                  className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-320px)] p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Hi! I'm your Operations Agent.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                I can help you manage tasks, analyze projects, run workflows,
                and much more!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {msg.content}
                  </pre>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Quick Actions:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={async () => {
                  setInput(action.action);
                  // Wait for state update then send
                  setTimeout(() => {
                    document
                      .querySelector<HTMLButtonElement>(
                        'button[aria-label="Send message"]'
                      )
                      ?.click();
                  }, 100);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 transition-colors"
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white dark:bg-gray-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
