"use client";

import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
    onClick: () => void;
    label?: string;
    className?: string;
}

export function BackButton({ onClick, label = "Return", className = "" }: BackButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`group flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-all duration-500 ${className}`}
        >
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-500 overflow-hidden">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-500 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="relative group-hover:translate-x-1 transition-transform duration-500">{label}</span>
        </button>
    );
}
