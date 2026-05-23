"use client";

import { SelectionGate } from "./components/selection-gate";

export function ResumeUpload({ selectedId: _selectedId }: { selectedId: string | null }) {
    return (
        <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-1000 relative px-2 sm:px-0 h-full flex flex-col justify-center">
            <div className="text-center px-4 space-y-6 mb-8 shrink-0">
                <h1 className="font-heading text-4xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tighter text-white leading-tight">
                    Architect Your <br className="sm:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic font-light drop-shadow-[0_0_40px_rgba(242,170,76,0.4)]">
                        Future.
                    </span>
                </h1>
                <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto font-light tracking-wide leading-relaxed">
                    Unlock AI-driven insights and precision tools to elevate your resume and land your next elite role.
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <SelectionGate />
            </div>
        </div>
    );
}
