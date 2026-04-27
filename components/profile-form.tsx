"use client";

import { useState } from "react";
import { User, Briefcase, GraduationCap, ShieldCheck, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
                {section === "personal" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Personal Information</h2>
                            <p className="text-white/40 text-sm mt-1">Basic details for application headers.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="full_name">Full Name</label>
                                <input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="email">Email Address</label>
                                <input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="phone_number">Phone Number</label>
                                <input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="+91 ..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all text-white/60" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">City / Country</label>
                                <input value={formData.city_country} onChange={(e) => setFormData({ ...formData, city_country: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="Mumbai, India" />
                            </div>
                        </div>
                    </div>
                )}

                {section === "professional" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Professional DNA</h2>
                            <p className="text-white/40 text-sm mt-1">Your core metrics and industry links.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Headline / Current Role</label>
                                <input value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="Senior Frontend Engineer" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Years of Experience</label>
                                <input type="number" value={formData.years_experience} onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="portfolio_url">Portfolio / GitHub URL</label>
                                <input id="portfolio_url" value={formData.portfolio_url} onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="https://..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Primary Skills</label>
                                <textarea value={formData.primary_skills} onChange={(e) => setFormData({ ...formData, primary_skills: e.target.value })} className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none" placeholder="React, Next.js, TypeScript..." />
                            </div>
                        </div>
                    </div>
                )}

                {section === "education" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Academic Foundation</h2>
                            <p className="text-white/40 text-sm mt-1">Highest qualification and institution details.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">University / Institution</label>
                                <input value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="IIT Bombay" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Field of Study</label>
                                <input value={formData.field_of_study} onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="Computer Science" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Graduation Year</label>
                                <input value={formData.graduation_year} onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="2024" />
                            </div>
                        </div>
                    </div>
                )}

                {section === "preferences" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Strategic Preferences</h2>
                            <p className="text-white/40 text-sm mt-1">Your non-negotiables and ideal work environment.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Work Preference</label>
                                <select value={formData.work_preference} onChange={(e) => setFormData({ ...formData, work_preference: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all appearance-none text-white/60">
                                    <option>Remote</option>
                                    <option>Hybrid</option>
                                    <option>On-site</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Ideal Company Culture</label>
                                <input value={formData.ideal_culture} onChange={(e) => setFormData({ ...formData, ideal_culture: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="High-growth startup, async-first..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Non-Negotiables (Red Lines)</label>
                                <textarea value={formData.non_negotiables} onChange={(e) => setFormData({ ...formData, non_negotiables: e.target.value })} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none" placeholder="No weekends, health insurance, learning budget..." />
                            </div>
                        </div>
                    </div>
                )}

                {section === "legal" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <header>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Strategy & Legal</h2>
                            <p className="text-white/40 text-sm mt-1">Information for background checks and fit.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Work Authorization</label>
                                <select value={formData.work_authorization} onChange={(e) => setFormData({ ...formData, work_authorization: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all appearance-none text-white/60">
                                    <option>Authorized to work in India</option>
                                    <option>Requires Visa Sponsorship</option>
                                    <option>US Citizen / Green Card</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Nationality</label>
                                <input value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="Indian" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Strategic "Why Me" Pitch</label>
                                <textarea value={formData.hire_pitch} onChange={(e) => setFormData({ ...formData, hire_pitch: e.target.value })} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none" placeholder="Explain your unique value proposition..." />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="bg-primary text-black px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                        {loading ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            </div>
        </div>
    );
}
