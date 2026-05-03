import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorViewProps {
    error: string;
    onReset: () => void;
}

export function ErrorView({ error, onReset }: ErrorViewProps) {
    return (
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="w-20 h-20 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center relative z-10">
                <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="relative z-10 space-y-2">
                <h2 className="font-heading text-2xl font-bold text-white tracking-tight">System Overloaded</h2>
                <p className="text-red-200/60 max-w-md mx-auto leading-relaxed">{error}</p>
            </div>
            <button 
                onClick={onReset}
                className="relative z-10 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105"
            >
                Return to Dashboard
            </button>
        </div>
    );
}
