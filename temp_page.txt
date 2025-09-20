"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeProvider } from "@/lib/themes/provider";
import ModernPage from "./(modern)/page";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function HomePage() {
  const router = useRouter();
  const useModernUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  useEffect(() => {
    if (!useModernUI) {
      router.push("/dashboard");
    }
  }, [useModernUI, router]);

  if (!useModernUI) {
    // Show loading state while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Wrap ModernPage with ThemeProvider and ErrorBoundary to prevent crashes
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ModernPage />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
