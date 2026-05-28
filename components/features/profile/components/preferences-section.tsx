"use client";

import { ProfileData } from "../profile-form";
import { Globe, Users, Ban, ChevronDown } from "lucide-react";

interface PreferencesSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function PreferencesSection({ formData, setFormData }: PreferencesSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Strategic Preferences
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Define your working styles, culture expectations, and critical career boundaries.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1">
                        Work Preference
                    </label>
                    <div className="flex items-center gap-3 relative">
                        <Globe className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <select 
                            value={formData.work_preference} 
                            onChange={(e) => setFormData({ ...formData, work_preference: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                            <option className="bg-zinc-950 text-white">Remote</option>
                            <option className="bg-zinc-950 text-white">Hybrid</option>
                            <option className="bg-zinc-950 text-white">On-site</option>
                        </select>
                        <ChevronDown className="absolute right-0 w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors pointer-events-none" />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="ideal_culture">
                        Ideal Company Culture
                    </label>
                    <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="ideal_culture"
                            value={formData.ideal_culture} 
                            onChange={(e) => setFormData({ ...formData, ideal_culture: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. High-growth startup, async-first..." 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-4 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-2">
                        Non-Negotiables (Red Lines)
                    </label>
                    <div className="flex gap-3 items-start">
                        <Ban className="w-4 h-4 text-white/20 mt-1 group-focus-within:text-primary/50 transition-colors" />
                        <textarea 
                            value={formData.non_negotiables} 
                            onChange={(e) => setFormData({ ...formData, non_negotiables: e.target.value })} 
                            className="w-full h-32 bg-transparent text-sm text-white outline-none resize-none placeholder:text-white/20 leading-relaxed" 
                            placeholder="e.g. No weekend work, medical insurance, local timezone overlapping..." 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
