"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeMenu } from "./ThemeMenu";
import { Badge } from "./Badge";
import {
  LogOut,
  Bot,
  Settings,
  FolderOpen,
  Briefcase,
  BarChart3,
  Home,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/lib/themes/provider";
import { useSession } from "next-auth/react";

export function GlassTopBar({ onAIToggle }: { onAIToggle?: () => void }) {
  const { clarity } = useTheme();
  const { data: session } = useSession();
  const pathname = usePathname();

  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

  const navItems = [
    { href: "/glass-home", icon: Home, label: "Home" },
    { href: "/projects", icon: FolderOpen, label: "Projects" },
    { href: "/tasks", icon: Briefcase, label: "Tasks" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className={`sticky top-0 z-20 backdrop-blur-xl ${clarity ? "bg-black/55" : "bg-black/25"} border-b border-white/15`}
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        {/* LEFT: Logo & Nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/glass-home"
            className="font-semibold tracking-tight text-white hover:opacity-80 transition"
          >
            GoGentic Portal
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition
                    ${
                      isActive
                        ? clarity
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }
                    ${focus}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: User, Theme, AI & Sign Out */}
        <div className="flex items-center gap-3">
          {session?.user?.name && <Badge>{session.user.name}</Badge>}
          <ThemeMenu />
          {onAIToggle && (
            <button
              onClick={onAIToggle}
              className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 transition ${
                clarity
                  ? "bg-purple-500/20 text-white border-purple-400/40 hover:bg-purple-500/30"
                  : "bg-purple-500/10 text-white border-purple-400/20 hover:bg-purple-500/20"
              } ${focus}`}
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 transition ${
              clarity
                ? "bg-white/10 text-white border-white/25 hover:bg-white/15"
                : "bg-white/5 text-white border-white/20 hover:bg-white/10"
            } ${focus}`}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
