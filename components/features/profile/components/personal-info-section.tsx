"use client";

interface PersonalInfoSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function PersonalInfoSection({ formData, setFormData }: PersonalInfoSectionProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Personal Information
                </h2>
                <p className="text-white/40 text-sm font-light leading-relaxed">
                    Update your foundational profile details used for resume headers and contact information.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1" htmlFor="full_name">Full Name</label>
                    <input 
                        id="full_name" 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. Alexander Pierce" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1" htmlFor="email">Email Address</label>
                    <input 
                        id="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="alexander@example.com"
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1" htmlFor="phone_number">Phone Number</label>
                    <input 
                        id="phone_number" 
                        value={formData.phone_number} 
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="+1 (555) 000-0000" 
                    />
                </div>
                <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Date of Birth</label>
                    <input 
                        type="date" 
                        value={formData.dob} 
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all [color-scheme:dark]" 
                    />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 ml-1">Location (City / Country)</label>
                    <input 
                        value={formData.city_country} 
                        onChange={(e) => setFormData({ ...formData, city_country: e.target.value })} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" 
                        placeholder="e.g. San Francisco, USA" 
                    />
                </div>
            </div>
        </div>
    );
}
