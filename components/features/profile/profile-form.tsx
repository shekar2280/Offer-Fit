"use client";

import { useState } from "react";
import { User, Briefcase, GraduationCap, ShieldCheck, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PersonalInfoSection } from "./components/personal-info-section";
import { ProfessionalSection } from "./components/professional-section";
import { EducationSection } from "./components/education-section";
import { PreferencesSection } from "./components/preferences-section";
import { LegalSection } from "./components/legal-section";
import { LogoutButton } from "../auth/logout-button";
import { User as SupabaseUser } from "@supabase/supabase-js";

export interface ProfileData {
    full_name?: string;
    email?: string;
    phone_number?: string;
    city_country?: string;
    dob?: string;
    headline?: string;
    years_experience?: number | string;
    portfolio_url?: string;
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
    const [formData, setFormData] = useState<ProfileData>({
        full_name: initialData?.full_name || "",
        email: initialData?.email || user?.email || "",
        phone_number: initialData?.phone_number || "",
        city_country: initialData?.city_country || "",
        dob: initialData?.dob || "",
        headline: initialData?.headline || "",
        years_experience: initialData?.years_experience || "",
        portfolio_url: initialData?.portfolio_url || "",
        primary_skills: initialData?.primary_skills || "",
        university: initialData?.university || "",
        field_of_study: initialData?.field_of_study || "",
        graduation_year: initialData?.graduation_year || "",
        work_authorization: initialData?.work_authorization || "Authorized to work in India",
        nationality: initialData?.nationality || "",
        hire_pitch: initialData?.hire_pitch || "",
        ideal_culture: initialData?.ideal_culture || "",
        work_preference: initialData?.work_preference || "Remote",
        non_negotiables: initialData?.non_negotiables || "",
    });

    const sections = [
        { id: "personal", label: "Personal", icon: User },
        { id: "professional", label: "Professional", icon: Briefcase },
        { id: "education", label: "Education", icon: GraduationCap },
        { id: "preferences", label: "Preferences", icon: Globe },
        { id: "legal", label: "Legal & Bio", icon: ShieldCheck },
    ];

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        const cleanedData = {
            ...formData,
            years_experience: formData.years_experience === undefined || formData.years_experience === "" ? null : parseInt(formData.years_experience.toString()),
            dob: formData.dob === "" ? null : formData.dob,
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
            alert("Error: " + error.message);
        } else {
            alert("Profile updated!");
        }
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            <aside className="w-72 h-full border-r border-white/[0.06] bg-black/20 backdrop-blur-3xl flex flex-col pt-4 pr-6 pb-6 pl-0 shrink-0 overflow-y-auto no-scrollbar">
                <nav className="space-y-1">
                    {sections.map((s) => {
                        const isActive = section === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSection(s.id)}
                                className={`w-full flex items-center gap-4 pl-4 pr-6 py-4 rounded-r-2xl text-sm font-medium transition-all group relative overflow-hidden ${
                                    isActive 
                                        ? "text-primary bg-primary/10" 
                                        : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full shadow-[0_0_12px_rgba(242,170,76,0.5)]" />
                                )}
                                <s.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                                <span className="tracking-wide">{s.label}</span>
                            </button>
                        );
                    })}
                    
                    <div className="pt-6 mt-6 ml-4 border-t border-white/[0.06]">
                        <LogoutButton />
                    </div>
                </nav>
            </aside>

            <main className="flex-1 h-full overflow-y-auto no-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(242,170,76,0.03),_transparent_40%)]">
                <div className="max-w-4xl mx-auto pt-6 pb-16 px-8 md:px-12">
                    <div className="relative group/container">
                        <div className="absolute -inset-px bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-[3rem] pointer-events-none" />
                        <div className="relative bg-black/40 border border-white/[0.08] rounded-[3rem] p-8 md:p-14 backdrop-blur-3xl shadow-2xl overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                {section === "personal" && <PersonalInfoSection formData={formData} setFormData={setFormData} />}
                                {section === "professional" && <ProfessionalSection formData={formData} setFormData={setFormData} />}
                                {section === "education" && <EducationSection formData={formData} setFormData={setFormData} />}
                                {section === "preferences" && <PreferencesSection formData={formData} setFormData={setFormData} />}
                                {section === "legal" && <LegalSection formData={formData} setFormData={setFormData} />}

                                <div className="mt-16 pt-8 border-t border-white/[0.06] flex justify-end">
                                    <button 
                                        onClick={handleSave} 
                                        disabled={loading} 
                                        className="group/btn relative px-10 py-4 bg-primary text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_-5px_rgba(242,170,76,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {loading ? "Syncing..." : "Save Profile Changes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
