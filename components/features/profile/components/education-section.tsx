"use client";

interface EducationSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function EducationSection({ formData, setFormData }: EducationSectionProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Academic Foundation
                </h2>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                    Highest degree qualification, institution details, and graduation timeline.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">University / Institution</label>
                    <input 
                        value={formData.university} 
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. Stanford University" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Field of Study</label>
                    <input 
                        value={formData.field_of_study} 
                        onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. Computer Science" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Graduation Year</label>
                    <input 
                        value={formData.graduation_year} 
                        onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="2024" 
                    />
                </div>
            </div>
        </div>
    );
}
