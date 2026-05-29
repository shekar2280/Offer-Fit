"use client";

import { ProfileData } from "../profile-form";
import { GraduationCap, BookOpen, Calendar } from "lucide-react";

interface EducationSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function EducationSection({ formData, setFormData }: EducationSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Academic Foundation
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Specify your educational history, degree majors, and graduation timelines.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="university">
                        University / Institution
                    </label>
                    <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="university"
                            value={formData.university} 
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. Stanford University" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="field_of_study">
                        Field of Study
                    </label>
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="field_of_study"
                            value={formData.field_of_study} 
                            onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. Computer Science" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.16] focus-within:border-primary/60 focus-within:shadow-[0_0_30px_rgba(242,170,76,0.08)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="graduation_year">
                        Graduation Year
                    </label>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="graduation_year"
                            value={formData.graduation_year} 
                            onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. 2024" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
