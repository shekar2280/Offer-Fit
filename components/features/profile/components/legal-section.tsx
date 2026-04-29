"use client";

interface LegalSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function LegalSection({ formData, setFormData }: LegalSectionProps) {
    return (
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
    );
}
