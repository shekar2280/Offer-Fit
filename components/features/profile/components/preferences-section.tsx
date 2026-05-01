"use client";

interface PreferencesSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function PreferencesSection({ formData, setFormData }: PreferencesSectionProps) {
    return (
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
    );
}
