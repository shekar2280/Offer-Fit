"use client";

import { ProfileData } from "../profile-form";

interface ProfessionalSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function ProfessionalSection({ formData, setFormData }: ProfessionalSectionProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Professional DNA
                </h2>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                    Define your expertise, experience metrics, and professional presence links.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Headline / Current Role</label>
                    <input 
                        value={formData.headline} 
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. Senior Frontend Engineer" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Years of Experience</label>
                    <input 
                        type="number" 
                        value={formData.years_experience} 
                        onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="5" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1" htmlFor="portfolio_url">Portfolio / GitHub URL</label>
                    <input 
                        id="portfolio_url" 
                        value={formData.portfolio_url} 
                        onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="https://github.com/..." 
                    />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Primary Skills</label>
                    <textarea 
                        value={formData.primary_skills} 
                        onChange={(e) => setFormData({ ...formData, primary_skills: e.target.value })} 
                        className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all resize-none placeholder:text-white/20 leading-relaxed" 
                        placeholder="e.g. React, Next.js, TypeScript, Tailwind CSS..." 
                    />
                </div>
            </div>
        </div>
    );
}
