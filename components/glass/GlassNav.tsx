"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Briefcase,
  BarChart3,
  Clock,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Mission Control",
    icon: LayoutDashboard,
    description: "Portfolio overview",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderOpen,
    description: "All projects",
  },
  {
    href: "/my-work",
    label: "My Work",
    icon: Briefcase,
    description: "Your tasks",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Analytics & metrics",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
    description: "Detailed reports",
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Clock,
    description: "Recent updates",
  },
  {
    href: "/team",
    label: "Team",
    icon: Users,
    description: "Team members",
  },
];

interface GlassNavProps {
  className?: string;
}

export function GlassNav({ className = "" }: GlassNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Main Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-2xl border-b border-white/5 ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <img
                  src="/Gogentic.ai.png"
                  alt="Gogentic.ai"
                  className="h-8 w-auto opacity-90"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1 ml-10">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className={`
                          relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium 
                          transition-all duration-200 group
                          ${
                            isActive
                              ? "bg-white/10 text-white border border-white/20"
                              : "text-white/70 hover:text-white/90 hover:bg-white/5"
                          }
                        `}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                            layoutId="activeTab"
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        <Icon className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">{item.label}</span>

                        {/* Hover glow */}
                        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Settings */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Link
                  href="/settings"
                  className="p-2 text-white/70 hover:text-white/90 rounded-xl hover:bg-white/5 transition-all duration-200"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </motion.div>

              {/* Mobile menu button */}
              <motion.button
                className="md:hidden p-2 text-white/70 hover:text-white/90 rounded-xl hover:bg-white/5 transition-all duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Subtle bottom highlight */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          className="fixed inset-0 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <motion.div
            className="absolute top-16 left-4 right-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-4"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl text-sm transition-all duration-200
                        ${
                          isActive
                            ? "bg-white/10 text-white border border-white/20"
                            : "text-white/70 hover:text-white/90 hover:bg-white/5"
                        }
                      `}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
