"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ModernPage from "./(modern)/page";

export default function HomePage() {
  const router = useRouter();
  const useModernUI = process.env.NEXT_PUBLIC_NEW_UI === "true";

  useEffect(() => {
    if (!useModernUI) {
      router.push("/dashboard");
    }
  }, [useModernUI, router]);

  if (!useModernUI) {
    return null; // While redirecting
  }

  // Render the modern page directly
  return <ModernPage />;
}
