"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import { Suspense, useEffect, useState } from "react";
import { useAnalysis } from "@/lib/context/analysis-context";

export default function Home() {
  const { resetSession } = useAnalysis();

  useEffect(() => {
    resetSession();
  }, [resetSession]);

  return (
    <main className="h-screen w-full bg-background text-foreground overflow-hidden">
      <Suspense fallback={<div className="h-screen w-full bg-background animate-pulse" />}>
        <DashboardContainer />
      </Suspense>
    </main>
  );
}

function DashboardContainer() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  return <DashboardShell user={user} />;
}
