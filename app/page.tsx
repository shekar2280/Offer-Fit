"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/services/supabase/client";
import { Suspense, useEffect, useState } from "react";
import { useAnalysis } from "@/components/providers/analysis-provider";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const { resetSession } = useAnalysis();
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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
      } catch {
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
