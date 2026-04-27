import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="h-screen w-full bg-background text-foreground overflow-hidden">
      <Suspense fallback={<div className="h-screen w-full bg-background animate-pulse" />}>
        <DashboardContainer />
      </Suspense>
    </main>
  );
}

async function DashboardContainer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <DashboardShell user={user} />;
}
