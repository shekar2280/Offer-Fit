import React from "react";
import { FileText } from "lucide-react";

interface LoadingScanningProps {
    mode: "analysis" | "customize";
}

export function LoadingScanning({ mode }: LoadingScanningProps) {
    return (
        <div className="space-y-12 w-full py-12 flex flex-col items-center">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-2 border-primary/5 animate-[spin_3s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border-t-2 border-primary/20 animate-[spin_2s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border-b-2 border-primary/40 animate-[spin_1.5s_linear_infinite]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative bg-black/50 p-4 rounded-2xl border border-primary/20 backdrop-blur-xl">
                            <FileText className="w-8 h-8 text-primary" />
                            <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                                <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,1)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 text-center max-w-xs">
                <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-primary animate-pulse">
                        Extracting Information
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                    </div>
                </div>
                <p className="text-[11px] text-white/30 font-medium leading-relaxed italic">
                    {mode === "customize" 
                        ? "Architecting a high-conversion resume structure..." 
                        : "Parsing deep experience patterns and market alignment..."}
                </p>
            </div>

            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-[scan_2s_linear_infinite] pointer-events-none" />
        </div>
    );
}
