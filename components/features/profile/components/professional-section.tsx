"use client";

interface ProfessionalSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function ProfessionalSection({ formData, setFormData }: ProfessionalSectionProps) {
    return (
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
    );
}
