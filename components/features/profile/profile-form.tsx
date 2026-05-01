"use client";

import { useState } from "react";
import { User, Briefcase, GraduationCap, ShieldCheck, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PersonalInfoSection } from "./components/personal-info-section";
import { ProfessionalSection } from "./components/professional-section";
import { EducationSection } from "./components/education-section";
import { PreferencesSection } from "./components/preferences-section";
import { LegalSection } from "./components/legal-section";

export function ProfileForm({ initialData, user }: { initialData?: any, user: any }) {
    const [section, setSection] = useState("personal");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
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
            years_experience: formData.years_experience === "" ? null : parseInt(formData.years_experience.toString()),
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
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 py-10">
            <aside className="w-full lg:w-64 space-y-2">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setSection(s.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${section === s.id ? "bg-primary text-black" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
                    >
                        <s.icon className="w-4 h-4" />
                        {s.label}
                    </button>
                ))}
            </aside>

            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-3xl shadow-2xl">
                {section === "personal" && <PersonalInfoSection formData={formData} setFormData={setFormData} />}
                {section === "professional" && <ProfessionalSection formData={formData} setFormData={setFormData} />}
                {section === "education" && <EducationSection formData={formData} setFormData={setFormData} />}
                {section === "preferences" && <PreferencesSection formData={formData} setFormData={setFormData} />}
                {section === "legal" && <LegalSection formData={formData} setFormData={setFormData} />}

                <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="bg-primary text-black px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                        {loading ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            </div>
        </div>
    );
}
