"use client";

import React from "react";
import Link from "next/link";
import { ThemeMenu } from "./ThemeMenu";
import { Badge } from "./Badge";
import { LogOut, Bot } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/lib/themes/provider";
import { useSession } from "next-auth/react";

export function GlassTopBar({ onAIToggle }: { onAIToggle?: () => void }) {
  const { clarity } = useTheme();
  const { data: session } = useSession();

  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

  return (
    <div
      className={`sticky top-0 z-20 backdrop-blur-xl ${clarity ? "bg-black/55" : "bg-black/25"} border-b border-white/15`}
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between relative">
        {/* LEFT: Logo & User */}
        <div className="flex items-center gap-4">
          <Link
            href="/glass-home"
            className="font-semibold tracking-tight text-white hover:opacity-80 transition"
          >
            GoGentic Portal
          </Link>
          {session?.user?.name && <Badge>{session.user.name}</Badge>}
        </div>

        {/* CENTER: Theme Menu */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ThemeMenu />
        </div>

        {/* RIGHT: AI & Sign Out */}
        <div className="flex items-center gap-2">
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
