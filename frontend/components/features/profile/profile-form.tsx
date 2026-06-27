"use client";

import { useState } from "react";
import { User, Terminal, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { PersonalInfoSection } from "./components/personal-info-section";
import { ProjectIntelligenceSection } from "./components/project-intelligence-section";
import { FeedbackSection } from "./components/feedback-section";
import { LogoutButton } from "../auth/logout-button";
import { DeleteAccountButton } from "../auth/delete-account-button";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";
import logoImg from "../../../app/icon.png";

export interface ProfileData {
    full_name?: string;
    email?: string;
}

export function ProfileForm({ initialData, user }: { initialData?: ProfileData, user: SupabaseUser }) {
    const [section, setSection] = useState("personal");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [formData, setFormData] = useState<ProfileData>({
        full_name: initialData?.full_name || "",
        email: initialData?.email || user?.email || "",
    });

    const sections = [
        { id: "personal", label: "Personal Info", icon: User },
        { id: "projects", label: "Projects", icon: Terminal },
        { id: "feedback", label: "Feedback", icon: MessageSquare },
    ];

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...formData,
                updated_at: new Date().toISOString(),
            });

        setLoading(false);
        if (error) {
            showToast("error", "Failed to save profile: " + error.message);
        } else {
            showToast("success", "Profile updated successfully!");
        }
    };

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden font-sans">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 bg-zinc-950/90 border-white/[0.08]">
                    {toast.type === "success" ? (
                        <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="p-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-xs font-semibold tracking-wide text-white">
                        {toast.message}
                    </span>
                </div>
            )}

            <aside className="w-80 h-full border-r border-white/[0.04] bg-[#070708] flex flex-col justify-between shrink-0 p-6">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 pb-5 mb-2 border-b border-white/[0.04]">
                        <div className="relative group shrink-0">
                            <div className="relative w-11 h-11 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden p-2.5 transition-all duration-300 shadow-[0_0_12px_rgba(242,170,76,0.1)] group-hover:shadow-[0_0_20px_rgba(242,170,76,0.2)]">
                                <Image 
                                    src={logoImg} 
                                    alt="OfferFit Logo" 
                                    width={24} 
                                    height={24} 
                                    className="object-contain w-full h-full drop-shadow-[0_0_8px_rgba(242,170,76,0.8)] opacity-90"
                                />
                            </div>
                        </div>
                        <div className="overflow-hidden flex flex-col justify-center">
                            <h3 className="text-[13px] font-semibold text-white tracking-wide truncate">
                                {formData.full_name || "Your Profile"}
                            </h3>
                            <p className="text-[11px] font-medium text-white/40 truncate mt-0.5">
                                {formData.email || "Manage account"}
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-1.5">
                        {sections.map((s) => {
                            const isActive = section === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSection(s.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? "text-white bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                                        : "text-white/40 hover:text-white/80 border border-transparent hover:bg-white/[0.02]"
                                        }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <s.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(242,170,76,0.6)]" : "group-hover:text-white/80"}`} />
                                        <span className="tracking-wide">{s.label}</span>
                                    </div>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,170,76,0.8)]" />
                                    )}
                                </button>
                            );
                        })}

                        <DeleteAccountButton />
                    </nav>
                </div>

                <div className="pt-6 border-t border-white/[0.04] flex flex-col gap-3">
                    <LogoutButton />
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto no-scrollbar bg-[#0b0b0d] bg-[radial-gradient(circle_at_top_right,_rgba(242,170,76,0.04),_transparent_40%)]">
                <div className="max-w-4xl mx-auto pt-10 pb-16 px-8 md:px-12 flex flex-col min-h-full justify-between">
                    <div className="relative bg-zinc-950/20 border border-white/[0.03] rounded-[2.5rem] p-8 md:p-12 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10">
                            {section === "personal" && <PersonalInfoSection formData={formData} setFormData={setFormData} />}
                            {section === "projects" && <ProjectIntelligenceSection user={user} />}
                            {section === "feedback" && <FeedbackSection userEmail={formData.email} userName={formData.full_name} />}
                        </div>

                        {section === "personal" && (
                            <div className="mt-12 pt-6 border-t border-white/[0.04] flex justify-end relative z-10">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="group relative px-8 py-3.5 bg-primary text-black rounded-xl font-extrabold text-[10px] uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(242,170,76,0.2)] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
