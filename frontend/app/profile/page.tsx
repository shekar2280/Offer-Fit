import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { createClient } from "@/services/supabase/server";
import { Suspense } from "react";

export default function ProfilePage() {
    return (
        <div className="h-screen bg-background text-foreground overflow-hidden">
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-64 h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />
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

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    return <ProfileForm user={user} initialData={profile} />;
}
