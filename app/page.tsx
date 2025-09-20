"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const useModernUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  useEffect(() => {
    if (!useModernUI) {
      // Redirect to classic dashboard if not using modern UI
      window.location.href = "/dashboard";
    }
  }, [useModernUI]);

  if (useModernUI) {
    // Import and render the modern page directly
    const ModernPage = require("./(modern)/page").default;
    return <ModernPage />;
  }

  // Fallback - redirect to dashboard
  redirect("/dashboard");
}
