"use client";

import { ProfileData } from "../profile-form";

interface LegalSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function LegalSection({ formData, setFormData }: LegalSectionProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Strategy & Legal
                </h2>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                    Background information, work authorization status, and your unique value pitch.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Work Authorization</label>
                    <div className="relative group/select">
                        <select 
                            value={formData.work_authorization} 
                            onChange={(e) => setFormData({ ...formData, work_authorization: e.target.value })} 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option className="bg-zinc-900">Authorized to work in India</option>
                            <option className="bg-zinc-900">Requires Visa Sponsorship</option>
                            <option className="bg-zinc-900">US Citizen / Green Card</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover/select:text-white/40 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Nationality</label>
                    <input 
                        value={formData.nationality} 
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. Indian" 
                    />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Strategic &quot;Why Me&quot; Pitch</label>
                    <textarea 
                        value={formData.hire_pitch} 
                        onChange={(e) => setFormData({ ...formData, hire_pitch: e.target.value })} 
                        className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all resize-none placeholder:text-white/20 leading-relaxed" 
                        placeholder="Explain your unique value proposition in 2-3 sentences..." 
                    />
                </div>
            </div>
        </div>
    );
}
