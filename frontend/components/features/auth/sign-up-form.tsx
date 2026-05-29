"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/services/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import Image from "next/image";
import logoImg from "../../../app/icon.png";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: "italic",
  display: "swap",
});

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "email") {
        setShowEmailForm(true);
      }
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/protected` },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full space-y-10", className)} {...props}>

      <div className="space-y-6">
        {!showEmailForm && (
          <div className="flex items-center gap-3.5 select-none animate-in fade-in duration-300">
            <Image 
              src={logoImg} 
              alt="OfferFit Logo" 
              width={40} 
              height={40} 
              priority
              className="w-10 h-10 object-contain"
            />
            <span className={`${spaceGrotesk.className} text-3xl font-black tracking-tight text-white`}>
              OFFER<span className="text-[#f2aa4c] font-light">FIT</span>
            </span>
          </div>
        )}

        {!showEmailForm ? (
          <div className="space-y-2 animate-in fade-in duration-300">
            <h1 className="text-3xl font-black text-white tracking-tight">Create account</h1>
            <p className="text-sm text-white/40 leading-relaxed">
              Join thousands of professionals landing better offers.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => { setShowEmailForm(false); setError(null); }}
              className="flex items-center gap-2 text-[11px] text-white/35 hover:text-[#f2aa4c] transition-colors font-semibold uppercase tracking-wider mb-6"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Back
            </button>
            <h1 className="text-3xl font-black text-white tracking-tight">Sign up with email</h1>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!showEmailForm ? (
        <div className="space-y-4 animate-in fade-in duration-300">

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group w-full flex items-center gap-4 px-5 py-4 bg-white/[0.04] border border-white/[0.08] hover:border-[#f2aa4c]/30 hover:bg-white/[0.06] rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Continue with Google</p>
              <p className="text-[11px] text-white/35 mt-0.5">Quick setup with your Google account</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#f2aa4c]/60 group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            disabled={isLoading}
            className="group w-full flex items-center gap-4 px-5 py-4 bg-white/[0.04] border border-white/[0.08] hover:border-[#f2aa4c]/30 hover:bg-white/[0.06] rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-white/60">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Continue with Email</p>
              <p className="text-[11px] text-white/35 mt-0.5">Register with your email address</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#f2aa4c]/60 group-hover:translate-x-0.5 transition-all duration-200" />
          </button>

        </div>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-black">
                Email address
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-white/[0.12] focus:border-[#f2aa4c]/60 rounded-none px-0 h-11 text-white text-sm placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-black">
                Password
              </Label>
              <Input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-white/[0.12] focus:border-[#f2aa4c]/60 rounded-none px-0 h-11 text-white text-sm focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm" className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-black">
                Confirm Password
              </Label>
              <Input
                id="signup-confirm"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-white/[0.12] focus:border-[#f2aa4c]/60 rounded-none px-0 h-11 text-white text-sm focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#f2aa4c] hover:bg-[#e89e3c] text-black font-black text-sm rounded-xl transition-all duration-200 shadow-[0_6px_30px_rgba(242,170,76,0.3)] hover:shadow-[0_8px_36px_rgba(242,170,76,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      )}

      <p className="text-sm text-white/30 text-center pt-4 border-t border-white/[0.05]">
        Already have an account?{" "}
        <Link 
          href={showEmailForm ? "/auth/login?mode=email" : "/auth/login"} 
          className="text-[#f2aa4c] hover:text-[#f2aa4c]/75 font-bold transition-colors"
        >
          Sign in
        </Link>
      </p>

    </div>
  );
}
