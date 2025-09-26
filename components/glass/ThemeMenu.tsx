"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  Palette,
  Contrast,
  Home,
  FolderOpen,
  Users,
  FileText,
  Activity,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Shield,
  Settings,
} from "lucide-react";
import { useTheme } from "@/lib/themes/provider";
import { THEMES, ThemeName } from "@/lib/themes/constants";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function ThemeMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const {
    theme,
    setTheme,
    clarity,
    setClarity,
    backgroundMode,
    setBackgroundMode,
  } = useTheme();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/auth/role");
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
        }
      }
    };
    fetchUserRole();
  }, [session]);

  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80";

  const navItems = [
    { href: "/glass-home", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    ...(userRole === "admin" || userRole === "pm"
      ? [{ href: "/team", label: "Team", icon: Users }]
      : []),
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={`rounded-xl p-2 border border-white/25 bg-white/10 hover:bg-white/15 transition ${focus} inline-flex items-center`}
      >
        <Menu className="h-5 w-5" />
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute left-1/2 -translate-x-1/2 mt-3 w-72 rounded-2xl border border-white/25 bg-black/90 backdrop-blur-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,.35)] z-30"
        >
          {/* Navigation Links */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 flex items-center gap-3 ${focus} ${
                  isActive ? "bg-white/15" : ""
                }`}
              >
                <Icon className="h-4 w-4 text-white/70" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Section - Only show for admins */}
          {userRole === "admin" && (
            <>
              <div className="my-2 h-px bg-white/10" />
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70">
                Admin
              </div>
              <Link
                href="/admin/users"
                onClick={() => setMenuOpen(false)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 flex items-center gap-3 ${focus} ${
                  pathname === "/admin/users" ? "bg-white/15" : ""
                }`}
              >
                <Shield className="h-4 w-4 text-red-400" />
                <span>User Management</span>
              </Link>
            </>
          )}

          <div className="my-2 h-px bg-white/10" />

          {/* Background Mode Toggle */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70 inline-flex items-center gap-2">
            {backgroundMode === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}{" "}
            Background
          </div>
          <div className="grid grid-cols-2 gap-2 px-2">
            <button
              onClick={() => setBackgroundMode("dark")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus} ${
                backgroundMode === "dark" ? "bg-white/15" : ""
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => setBackgroundMode("light")}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus} ${
                backgroundMode === "light" ? "bg-white/15" : ""
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
          </div>

          <div className="my-2 h-px bg-white/10" />

          {/* Clarity Toggle */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70 inline-flex items-center gap-2">
            <Contrast className="h-4 w-4" /> Display
          </div>
          <button
            onClick={() => setClarity(!clarity)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 ${focus} ${clarity ? "bg-white/15" : ""}`}
          >
            {clarity
              ? "High Contrast (Current)"
              : "Standard Contrast (Current)"}
          </button>

          <div className="my-2 h-px bg-white/10" />

          {/* Theme Selection */}
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/70 inline-flex items-center gap-2">
            <Palette className="h-4 w-4" /> Themes
          </div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {(Object.keys(THEMES) as ThemeName[]).map((name) => (
              <button
                key={name}
                onClick={() => {
                  setTheme(name);
                  setMenuOpen(false);
                }}
                className={`rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10 ${focus} ${
                  theme === name ? "bg-white/15" : ""
                }`}
              >
                {name.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="my-2 h-px bg-white/10" />

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white/10 flex items-center gap-3 text-red-400/90 ${focus}`}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
