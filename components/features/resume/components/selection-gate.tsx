"use client";

import { ArrowRight } from "lucide-react";
import { Marquee } from "./marquee";
import Link from "next/link";


export function SelectionGate() {


    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10 py-8 flex-1">
                <Link
                    href="/analyze"
                    className="group relative bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-primary/40 rounded-[2.5rem] p-8 sm:p-10 text-center transition-all duration-700 overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[220px] sm:min-h-[240px] backdrop-blur-xl"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none blur-3xl" />
                    
                    <div className="relative z-10 flex flex-col items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-500">
                            Resume Analysis
                        </h3>
                        <p className="text-white/40 text-xs sm:text-sm leading-relaxed font-light group-hover:text-white/60 transition-colors duration-500 max-w-sm mx-auto">
                            Score your resume against any job description. Find gaps and improve your match.
                        </p>
                    </div>

                    <div className="absolute bottom-8 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            Start Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                <Link
                    href="/customize"
                    className="group relative bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-primary/40 rounded-[2.5rem] p-8 sm:p-10 text-center transition-all duration-700 overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[220px] sm:min-h-[240px] backdrop-blur-xl"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-500">
                            Customize Resume
                        </h3>
                        <p className="text-white/40 text-xs sm:text-sm leading-relaxed font-light group-hover:text-white/60 transition-colors duration-500 max-w-sm mx-auto">
                            Create custom bullet points that match the job and add them to your resume.
                        </p>
                    </div>

                    <div className="absolute bottom-8 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            Customize Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>
            
            <div className="shrink-0 pb-8 opacity-60 hover:opacity-100 transition-opacity duration-700">
                <Marquee />
            </div>
        </div>
    );
}
