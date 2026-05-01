"use client";

interface EducationSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function EducationSection({ formData, setFormData }: EducationSectionProps) {
    return (
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
    );
}
