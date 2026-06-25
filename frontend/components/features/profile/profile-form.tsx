"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, GraduationCap, ShieldCheck, Globe, LogOut, CheckCircle2, AlertCircle, Sparkles, Terminal } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { PersonalInfoSection } from "./components/personal-info-section";
import { ProfessionalSection } from "./components/professional-section";
import { EducationSection } from "./components/education-section";
import { LegalSection } from "./components/legal-section";
import { ProjectIntelligenceSection } from "./components/project-intelligence-section";
import { LogoutButton } from "../auth/logout-button";
import { DeleteAccountButton } from "../auth/delete-account-button";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";
import logoImg from "../../../app/icon.png";

export interface ProfileData {
    full_name?: string;
    email?: string;
    city_country?: string;
    headline?: string;
    years_experience?: number | string;
    portfolio_url?: string;
    linkedin?: string;
    website?: string;
    primary_skills?: string;
    university?: string;
    field_of_study?: string;
    graduation_year?: string;
    work_authorization?: string;
    nationality?: string;
    hire_pitch?: string;
    ideal_culture?: string;
    work_preference?: string;
    non_negotiables?: string;
}

export function ProfileForm({ initialData, user }: { initialData?: ProfileData, user: SupabaseUser }) {
    const [section, setSection] = useState("personal");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [formData, setFormData] = useState<ProfileData>({
        full_name: initialData?.full_name || "",
        email: initialData?.email || user?.email || "",
        city_country: initialData?.city_country || "",
        headline: initialData?.headline || "",
        years_experience: initialData?.years_experience || "",
        portfolio_url: initialData?.portfolio_url || "",
        linkedin: initialData?.linkedin || "",
        website: initialData?.website || "",
        primary_skills: initialData?.primary_skills || "",
        university: initialData?.university || "",
        field_of_study: initialData?.field_of_study || "",
        graduation_year: initialData?.graduation_year || "",
        work_authorization: initialData?.work_authorization || "Authorized to work in India",
        nationality: initialData?.nationality || "",
        hire_pitch: initialData?.hire_pitch || "",
    });

    const sections = [
        { id: "personal", label: "Personal Info", icon: User },
        { id: "professional", label: "Professional DNA", icon: Briefcase },
        { id: "projects", label: "Projects", icon: Terminal },
        { id: "education", label: "Academic Info", icon: GraduationCap },
        { id: "legal", label: "Legal & Bio", icon: ShieldCheck },
    ];

    const fieldsToTrack = [
        formData.full_name,
        formData.city_country,
        formData.headline,
        formData.years_experience,
        formData.portfolio_url,
        formData.linkedin,
        formData.website,
        formData.primary_skills,
        formData.university,
        formData.field_of_study,
        formData.graduation_year,
        formData.work_authorization,
        formData.nationality,
        formData.hire_pitch
    ];

    const filledCount = fieldsToTrack.filter(v => v !== undefined && v !== null && v !== "").length;
    const readinessScore = Math.round((filledCount / fieldsToTrack.length) * 100);

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (typeof window !== "undefined" && formData) {
            window.postMessage({
                type: "FROM_RESUME_ANALYZER",
                action: "SYNC_PROFILE",
                data: formData
            }, "*");
        }
    }, [formData]);

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        const cleanedData = {
            ...formData,
            years_experience: formData.years_experience === undefined || formData.years_experience === "" ? null : parseInt(formData.years_experience.toString()),
        };

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...cleanedData,
                updated_at: new Date().toISOString(),
            });

        setLoading(false);
        if (error) {
            showToast("error", "Failed to sync: " + error.message);
        } else {
            if (typeof window !== "undefined") {
                window.postMessage({
                    type: "FROM_RESUME_ANALYZER",
                    action: "SYNC_PROFILE",
                    data: formData
                }, "*");
            }
            showToast("success", "Profile synchronized and extension autofill-ready!");
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
                    <div className="flex items-center gap-3.5 pb-2">
                        <div className="relative group">

                            <div className="relative w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden p-2.5 transition-shadow duration-300 hover:shadow-[0_0_16px_rgba(242,170,76,0.2)]">
                                <Image 
                                    src={logoImg} 
                                    alt="OfferFit Logo" 
                                    width={32} 
                                    height={32} 
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-sm font-bold text-white tracking-wide truncate">
                                {formData.full_name || "Profile Hub"}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 truncate">
                                {formData.headline || "User profile"}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/[0.04] space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-black uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                Autofill Readiness
                            </div>
                            <span className="text-xs font-black text-primary">
                                {readinessScore}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary via-orange-500 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(242,170,76,0.3)]"
                                style={{ width: `${readinessScore}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-white/40 leading-relaxed font-light">
                            {readinessScore > 75
                                ? "Profile optimized! Seamless one-click autofilling is active."
                                : "Fill out more fields to unlock flawless browser extension autofill."}
                        </p>
                    </div>

                    <nav className="space-y-1.5">
                        {sections.map((s) => {
                            const isActive = section === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSection(s.id)}
                                    className={`w-full flex items-center justify-between pl-4 pr-5 py-3.5 rounded-xl text-xs font-semibold transition-all group relative overflow-hidden ${isActive
                                        ? "text-primary bg-primary/10 border border-primary/20"
                                        : "text-white/40 hover:text-white border border-transparent hover:bg-white/[0.02]"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <s.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110 text-primary" : "group-hover:scale-110"}`} />
                                        <span className="tracking-wide">{s.label}</span>
                                    </div>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,170,76,0.5)]" />
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
                            {section === "professional" && <ProfessionalSection formData={formData} setFormData={setFormData} />}
                            {section === "projects" && <ProjectIntelligenceSection user={user} />}
                            {section === "education" && <EducationSection formData={formData} setFormData={setFormData} />}
                            {section === "legal" && <LegalSection formData={formData} setFormData={setFormData} />}
                        </div>

                        {section !== "projects" && (
                            <div className="mt-12 pt-6 border-t border-white/[0.04] flex justify-end relative z-10">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="group relative px-8 py-3.5 bg-primary text-black rounded-xl font-extrabold text-[10px] uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(242,170,76,0.2)] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? "Syncing..." : "Sync Profile changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
