"use client";

import { ProfileData } from "../profile-form";
import { Briefcase, Clock, Link2, Terminal, Linkedin, Globe } from "lucide-react";

interface ProfessionalSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function ProfessionalSection({ formData, setFormData }: ProfessionalSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Professional DNA
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Define your core expertise, experience levels, and primary skill listings.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="headline">
                        Headline / Current Role
                    </label>
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="headline"
                            value={formData.headline} 
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. Senior Frontend Engineer" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="years_experience">
                        Years of Experience
                    </label>
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="years_experience"
                            type="number" 
                            value={formData.years_experience} 
                            onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. 5" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="linkedin">
                        LinkedIn URL
                    </label>
                    <div className="flex items-center gap-3">
                        <Linkedin className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="linkedin" 
                            value={formData.linkedin} 
                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="https://linkedin.com/in/..." 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="portfolio_url">
                        Portfolio / GitHub URL
                    </label>
                    <div className="flex items-center gap-3">
                        <Link2 className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="portfolio_url" 
                            value={formData.portfolio_url} 
                            onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="https://github.com/..." 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="website">
                        Personal Website
                    </label>
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="website" 
                            value={formData.website} 
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="https://yourwebsite.com" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-4 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-2">
                        Primary Skills
                    </label>
                    <div className="flex gap-3 items-start">
                        <Terminal className="w-4 h-4 text-white/20 mt-1 group-focus-within:text-primary/50 transition-colors" />
                        <textarea 
                            value={formData.primary_skills} 
                            onChange={(e) => setFormData({ ...formData, primary_skills: e.target.value })} 
                            className="w-full h-32 bg-transparent text-sm text-white outline-none resize-none placeholder:text-white/20 leading-relaxed" 
                            placeholder="e.g. React, Next.js, TypeScript, Tailwind CSS..." 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
