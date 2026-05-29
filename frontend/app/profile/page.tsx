import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { createClient } from "@/services/supabase/server";
import { Suspense } from "react";
import Image from "next/image";
import logoImg from "../icon.png";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export default function ProfilePage() {
    return (
        <div className="h-screen bg-background text-foreground overflow-hidden">
            <Suspense fallback={
                <div className="h-screen w-full bg-[#020202] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#f2aa4c]/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[45%] bg-[#f2aa4c]/5 rounded-full blur-[100px] pointer-events-none" />
                    
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
