"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Link2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const settingsItems = [
  {
    title: "Profile",
    description: "Manage your personal information",
    icon: User,
    href: "/settings/profile",
    available: false,
  },
  {
    title: "Integrations",
    description: "Connect Google Drive, Slack, and other services",
    icon: Link2,
    href: "/settings/integrations",
    available: true,
  },
  {
    title: "Notifications",
    description: "Configure notification preferences",
    icon: Bell,
    href: "/settings/notifications",
    available: false,
  },
  {
    title: "Appearance",
    description: "Theme and display settings",
    icon: Palette,
    href: "/settings/appearance",
    available: false,
  },
  {
    title: "Security",
    description: "Password and authentication settings",
    icon: Shield,
    href: "/settings/security",
    available: false,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted hover:text-fg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l border-border pl-4">
                <h1 className="text-xl font-semibold text-fg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.available ? item.href : "#"}
                className={`
                  block bg-surface border border-border rounded-lg p-6
                  transition-all duration-200
                  ${
                    item.available
                      ? "hover:bg-surface/80 hover:border-brand cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }
                `}
                onClick={(e) => {
                  if (!item.available) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-bg rounded-lg">
                      <Icon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-medium text-fg">{item.title}</h3>
                      <p className="text-sm text-muted mt-1">
                        {item.description}
                      </p>
                      {!item.available && (
                        <p className="text-xs text-muted/50 mt-2">
                          Coming soon
                        </p>
                      )}
                    </div>
                  </div>
                  {item.available && (
                    <ChevronRight className="h-5 w-5 text-muted" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-brand/10 border border-brand/20 rounded-lg">
          <h3 className="font-medium text-fg mb-2">Quick Tip</h3>
          <p className="text-sm text-muted">
            Connect your Google Drive and Slack accounts in the Integrations
            section to enable the AI agent to create folders, upload files, and
            send messages on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
