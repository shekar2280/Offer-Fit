"use client";

interface PreferencesSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function PreferencesSection({ formData, setFormData }: PreferencesSectionProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Strategic Preferences
                </h2>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                    Define your non-negotiables, ideal work environment, and cultural alignment.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Work Preference</label>
                    <div className="relative group/select">
                        <select 
                            value={formData.work_preference} 
                            onChange={(e) => setFormData({ ...formData, work_preference: e.target.value })} 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option className="bg-zinc-900">Remote</option>
                            <option className="bg-zinc-900">Hybrid</option>
                            <option className="bg-zinc-900">On-site</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover/select:text-white/40 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Ideal Company Culture</label>
                    <input 
                        value={formData.ideal_culture} 
                        onChange={(e) => setFormData({ ...formData, ideal_culture: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. High-growth startup, async-first..." 
                    />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Non-Negotiables (Red Lines)</label>
                    <textarea 
                        value={formData.non_negotiables} 
                        onChange={(e) => setFormData({ ...formData, non_negotiables: e.target.value })} 
                        className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all resize-none placeholder:text-white/20 leading-relaxed" 
                        placeholder="e.g. No weekends, health insurance, remote-first, learning budget..." 
                    />
                </div>
            </div>
        </div>
    );
}
