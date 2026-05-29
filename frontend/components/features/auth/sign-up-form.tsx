"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/services/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-[440px] mx-auto", className)} {...props}>
      <div className="bg-white/[0.01] border border-white/[0.03] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden group/card">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
              Create Account
            </h1>
            <p className="text-sm text-white/40 font-medium">
              Join ResumeAI to optimize your career path
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/50 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-primary transition-colors placeholder:text-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-white/50 ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password" className="text-[10px] uppercase tracking-[0.2em] text-white/50 ml-1">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-primary transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_rgba(242,170,76,0.2)]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : "Create Account"}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-white/30">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary/60 hover:text-primary font-bold transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
