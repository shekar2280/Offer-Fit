"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import { Suspense, useEffect, useState } from "react";
import { useAnalysis } from "@/lib/context/analysis-context";
import { useRouter } from "next/navigation";

export default function Home() {
  const { resetSession } = useAnalysis();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

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
        } else {
          setUser(user);
        }
      } catch (error: unknown) {
        router.push("/auth/login");
      }
    };
    fetchUser();
  }, [supabase, router]);

  return (
    <main className="h-screen w-full bg-background text-foreground overflow-hidden">
      <Suspense fallback={<div className="h-screen w-full bg-background animate-pulse" />}>
        <DashboardShell user={user} />
      </Suspense>
    </main>
  );
}
