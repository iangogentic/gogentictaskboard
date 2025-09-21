"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { GlassCard, GlassButton } from "@/components/glass";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <GlassCard className="max-w-md w-full p-8 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-400/70" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white/90">
          Something went wrong!
        </h2>
        <p className="text-white/60 mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <GlassButton onClick={reset} variant="primary">
          Try again
        </GlassButton>
      </GlassCard>
    </div>
  );
}
