"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { GlassCard, GlassButton, GlassInput } from "@/components/glass";
import { AnimatedBackground } from "@/components/glass/AnimatedBackground";
import { motion } from "framer-motion";

// Check if credentials auth is enabled
const enableCredentials = true; // Always enabled for Claude testing

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enableCredentials) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/glass-home");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/glass-home" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8 space-y-8" glow delay={0.2}>
            {/* Header */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  GoGentic Portal
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-white/90 mb-2">
                Welcome Back
              </h2>
              <p className="text-white/70">
                Sign in to continue to your dashboard
              </p>
            </motion.div>

            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400/90 text-sm backdrop-blur-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Email/Password Form */}
              {enableCredentials && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <GlassInput
                      id="email"
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      icon={<Mail className="w-4 h-4" />}
                      required
                      glow
                    />

                    <GlassInput
                      id="password"
                      type="password"
                      label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4" />}
                      required
                      glow
                    />

                    <GlassButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      disabled={isLoading}
                      className="w-full mt-6"
                      icon={
                        isLoading ? <Loader2 className="w-4 h-4" /> : undefined
                      }
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </GlassButton>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-black/20 backdrop-blur-xl text-white/50 rounded-full">
                        Or continue with
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* OAuth Buttons */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <GlassButton
                  variant="secondary"
                  size="lg"
                  onClick={() => handleOAuthSignIn("google")}
                  className="w-full"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  }
                >
                  Continue with Google
                </GlassButton>
              </motion.div>

              {/* Sign up link */}
              {enableCredentials && (
                <motion.p
                  className="text-center text-sm text-white/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="text-white/70 hover:text-white/90 underline underline-offset-2 transition-colors"
                  >
                    Sign up
                  </Link>
                </motion.p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
