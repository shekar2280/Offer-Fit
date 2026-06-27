"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/services/supabase/client";
import { Suspense, useEffect, useState } from "react";
import { useAnalysis } from "@/components/providers/analysis-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoImg from "./icon.png";
import { User } from "@supabase/supabase-js";
import { CheckCircle2 } from "lucide-react";
import { Space_Grotesk } from "next/font/google";
import { OnboardingModal } from "@/components/features/resume/components/onboarding-modal";
import { useQueryClient } from "@tanstack/react-query";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export default function Home() {
  const { resetSession } = useAnalysis();
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const hasSeenWelcome = sessionStorage.getItem("offerfit_welcome_seen");
      if (!hasSeenWelcome && user.created_at && user.last_sign_in_at) {
        const createdAt = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at).getTime();
        
        if (lastSignIn - createdAt < 60000) {
          setWelcomeToast("Welcome to OfferFit!");
        } else {
          setWelcomeToast("Welcome back to OfferFit!");
        }
        sessionStorage.setItem("offerfit_welcome_seen", "true");
        setTimeout(() => setWelcomeToast(null), 4000);
      }
    }
  }, [user]);

  useEffect(() => {
    resetSession();
  }, [resetSession]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("resume_text")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.resume_text) {
          setShowOnboarding(true);
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [supabase, router]);

  const handleOnboardingComplete = (resumeText: string) => {
    setShowOnboarding(false);
    if (user) {
      queryClient.setQueryData(["profile", user.id], (old: Record<string, unknown> | undefined) => ({
        ...(old || {}),
        resume_text: resumeText,
      }));
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#020202] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[45%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-lg animate-pulse overflow-hidden p-2">
            <Image
              src={logoImg}
              alt="OfferFit Logo"
              width={64}
              height={64}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className={`${spaceGrotesk.className} text-3xl font-bold tracking-[0.08em] text-white select-none`}>
              OFFER<span className="text-[#f2aa4c] font-light">FIT</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full bg-background text-foreground overflow-hidden">
      {showOnboarding && user && (
        <OnboardingModal userId={user.id} onComplete={handleOnboardingComplete} />
      )}
      <Suspense fallback={<div className="h-screen w-full bg-background animate-pulse" />}>
        <DashboardShell user={user} />
      </Suspense>
      {welcomeToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-zinc-900 border border-primary/20 shadow-[0_0_30px_rgba(242,170,76,0.1)]">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-white">{welcomeToast}</span>
          </div>
        </div>
      )}
    </main>
  );
}
