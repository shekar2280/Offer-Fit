import { ProfileForm } from "@/components/features/profile/profile-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-background text-foreground px-6">
            <nav className="h-[72px] flex items-center max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hub
                </Link>
            </nav>
            
            <Suspense fallback={
                <div className="w-full max-w-5xl mx-auto py-20 animate-pulse">
                    <div className="h-64 bg-white/5 rounded-[2.5rem]" />
                </div>
            }>
                <ProfileContent />
            </Suspense>
        </div>
    );
}

async function ProfileContent() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    return <ProfileForm user={user} initialData={profile} />;
}
