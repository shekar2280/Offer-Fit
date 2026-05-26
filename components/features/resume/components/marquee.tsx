"use client";

import { 
    GoogleLogo, MicrosoftLogo, AmazonLogo, MetaLogo, NetflixLogo, 
    AppleLogo, UberLogo, AirbnbLogo, TeslaLogo, StripeLogo, SpotifyLogo 
} from "@/components/shared/brand-icon";

export function Marquee() {
    const brands = [
        GoogleLogo, MicrosoftLogo, AppleLogo, AmazonLogo, MetaLogo, 
        NetflixLogo, UberLogo, AirbnbLogo, TeslaLogo, StripeLogo, SpotifyLogo
    ];

    return (
        <div className="mt-8 sm:mt-12 relative z-10 w-full max-w-4xl mx-auto">
            <div className="text-[8px] sm:text-[9px] font-black tracking-[0.4em] uppercase text-primary/30 mb-4 flex items-center justify-center gap-4">
                <div className="w-12 sm:w-24 h-[1px] bg-gradient-to-r from-transparent to-primary/30" />
                TOP COMPANIES
                <div className="w-12 sm:w-24 h-[1px] bg-gradient-to-l from-transparent to-primary/30" />
            </div>
            <div className="bg-black/40 border border-white/[0.05] rounded-2xl py-5 sm:py-6 overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                
                <div className="flex gap-12 sm:gap-20 animate-marquee-right whitespace-nowrap items-center">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-12 sm:gap-20 items-center shrink-0">
                            {brands.map((Logo, idx) => (
                                <Logo key={idx} className="h-4 sm:h-5 w-auto transition-all duration-500 hover:scale-110" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-marquee-right {
                    animation: marquee-right 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
