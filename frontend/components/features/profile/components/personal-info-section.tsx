"use client";

import { ProfileData } from "../profile-form";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";

interface PersonalInfoSectionProps {
    formData: ProfileData;
    setFormData: (data: ProfileData) => void;
}

export function PersonalInfoSection({ formData, setFormData }: PersonalInfoSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            Personal Information
                        </h2>
                        <p className="text-white/40 text-xs font-light leading-relaxed">
                            Foundational details used for resume headers and autofilling contact info.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="full_name">
                        Full Name
                    </label>
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="full_name" 
                            value={formData.full_name} 
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. Alexander Pierce" 
                        />
                    </div>
                </div>

                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="email">
                        Email Address
                    </label>
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="email" 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="alexander@example.com"
                        />
                    </div>
                </div>



                <div className="group bg-zinc-950/40 border border-white/[0.06] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(242,170,76,0.05)] rounded-2xl px-5 py-3.5 transition-all md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors mb-1" htmlFor="city_country">
                        Location (City / Country)
                    </label>
                    <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                        <input 
                            id="city_country"
                            value={formData.city_country} 
                            onChange={(e) => setFormData({ ...formData, city_country: e.target.value })} 
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20" 
                            placeholder="e.g. San Francisco, USA" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
