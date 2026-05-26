import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { HistoryView } from "@/components/features/resume/components/history-view";

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-background animate-pulse" />}>
            <HistoryContent />
        </Suspense>
    );
}

async function HistoryContent() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const username = user.email?.split('@')[0] || "User";

    return (
        <div className="flex flex-col w-full bg-background text-foreground relative">
            <Navbar username={username} showMenuButton={false} />
            
            <main className="relative z-10">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                
                <HistoryView />
            </main>
        </div>
    );
}
