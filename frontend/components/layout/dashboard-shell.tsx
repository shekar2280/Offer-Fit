import { DashboardOverview } from "@/components/features/dashboard/dashboard-overview";
import { Navbar } from "@/components/layout/navbar";
import { User } from "@supabase/supabase-js";

export function DashboardShell({ user }: { user: User | null }) {
    const username = user?.email?.split('@')[0] || "User";

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <Navbar username={username} showMenuButton={false} />
            {user && <DashboardOverview user={user} hubEnabled={process.env.NEXT_PUBLIC_JOB_HUB_ENABLED === "true"} />}
        </div>
    );
}
