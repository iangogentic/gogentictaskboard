"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/themes/provider";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface GlassTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function GlassTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: GlassTabsProps) {
  const { clarity } = useTheme();

  return (
    <div
      className={`flex gap-2 p-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? clarity
                  ? "bg-white/20 text-white border border-white/30 shadow-lg"
                  : "bg-white/10 text-white border border-white/20"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            <span className="relative flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
