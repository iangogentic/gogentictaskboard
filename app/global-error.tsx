"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="max-w-md w-full p-8 text-center bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Something went wrong!
            </h2>
            <p className="text-white/70 mb-6">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
