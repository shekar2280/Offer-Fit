"use client";

import { ArrowRight, ScanLine, PenLine } from "lucide-react";
import Link from "next/link";

export function SelectionGate() {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                <Link
                    href="/analyze"
                    className="group relative flex flex-col justify-between p-8 min-h-[320px] bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-700 hover:border-primary/40 hover:-translate-y-2 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <span className="absolute -left-4 top-12 text-[120px] font-black text-white/[0.02] group-hover:text-primary/[0.05] group-hover:translate-x-4 transition-all duration-700 pointer-events-none select-none tracking-tighter leading-none">
                        ANALYZE
                    </span>

                    <div className="flex justify-between items-start w-full relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                            <ScanLine className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-500 backdrop-blur-md">
                            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-primary group-hover:-rotate-45 transition-all duration-500" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto pt-16">
                        <h3 className="text-[18px] sm:text-[22px] font-semibold text-white tracking-tight mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-500">
                            Resume Analysis
                        </h3>
                        <p className="text-sm sm:text-[15px] text-white/40 leading-relaxed max-w-sm group-hover:text-white/60 transition-colors duration-500">
                            Score your resume against job descriptions. Expose gaps, eliminate assumptions, and precision-engineer your match.
                        </p>
                    </div>
                </Link>

                <Link
                    href="/customize"
                    className="group relative flex flex-col justify-between p-8 min-h-[320px] bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-700 hover:border-primary/40 hover:-translate-y-2 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <span className="absolute -left-4 top-12 text-[120px] font-black text-white/[0.02] group-hover:text-primary/[0.05] group-hover:translate-x-4 transition-all duration-700 pointer-events-none select-none tracking-tighter leading-none">
                        CUSTOMIZE
                    </span>

                    <div className="flex justify-between items-start w-full relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                            <PenLine className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-500 backdrop-blur-md">
                            <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-primary group-hover:-rotate-45 transition-all duration-500" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto pt-16">
                        <h3 className="text-[18px] sm:text-[22px] font-semibold text-white tracking-tight mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-500">
                            Resume Customization
                        </h3>
                        <p className="text-sm sm:text-[15px] text-white/40 leading-relaxed max-w-sm group-hover:text-white/60 transition-colors duration-500">
                            Inject targeted bullet points tailored to specific roles. Stop guessing and start aligning with structural precision.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}