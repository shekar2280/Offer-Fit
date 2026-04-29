"use client";

interface PersonalInfoSectionProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function PersonalInfoSection({ formData, setFormData }: PersonalInfoSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <header>
                <h2 className="text-2xl font-bold tracking-tight text-white">Personal Information</h2>
                <p className="text-white/40 text-sm mt-1">Basic details for application headers.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="full_name">Full Name</label>
                    <input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="email">Email Address</label>
                    <input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30" htmlFor="phone_number">Phone Number</label>
                    <input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="+91 ..." />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Date of Birth</label>
                    <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all text-white/60" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">City / Country</label>
                    <input value={formData.city_country} onChange={(e) => setFormData({ ...formData, city_country: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" placeholder="Mumbai, India" />
                </div>
            </div>
        </div>
    );
}
