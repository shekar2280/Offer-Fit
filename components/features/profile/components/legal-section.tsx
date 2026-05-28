"use client";

import { ProfileData } from "../profile-form";
import { ShieldCheck, Flag, Sparkles, ChevronDown } from "lucide-react";

interface LegalSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function LegalSection({ formData, setFormData }: LegalSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Legal & Strategy
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Verify work eligibility credentials and craft your elevator pitch for quick form filling.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1">
                        Work Authorization
                    </label>
                    <div className="flex items-center gap-3 relative">
                        <ShieldCheck className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <select 
                            value={formData.work_authorization} 
                            onChange={(e) => setFormData({ ...formData, work_authorization: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                            <option className="bg-zinc-950 text-white">Authorized to work in India</option>
                            <option className="bg-zinc-950 text-white">Requires Visa Sponsorship</option>
                            <option className="bg-zinc-950 text-white">US Citizen / Green Card</option>
                        </select>
                        <ChevronDown className="absolute right-0 w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors pointer-events-none" />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="nationality">
                        Nationality
                    </label>
                    <div className="flex items-center gap-3">
                        <Flag className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="nationality"
                            value={formData.nationality} 
                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. Indian" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-4 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-2">
                        Strategic &quot;Why Me&quot; Pitch
                    </label>
                    <div className="flex gap-3 items-start">
                        <Sparkles className="w-4 h-4 text-white/20 mt-1 group-focus-within:text-primary/50 transition-colors" />
                        <textarea 
                            value={formData.hire_pitch} 
                            onChange={(e) => setFormData({ ...formData, hire_pitch: e.target.value })} 
                            className="w-full h-32 bg-transparent text-sm text-white outline-none resize-none placeholder:text-white/20 leading-relaxed" 
                            placeholder="Explain your unique value proposition in 2-3 sentences..." 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
