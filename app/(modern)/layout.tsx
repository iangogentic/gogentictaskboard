"use client";

import { ThemeProvider } from "@/lib/themes/provider";

export default function ModernLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
