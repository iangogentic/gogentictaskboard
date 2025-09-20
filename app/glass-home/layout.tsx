"use client";

import { ThemeProvider } from "@/lib/themes/provider";

export default function GlassHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
