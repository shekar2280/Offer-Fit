import React from "react";
import { ScanText, Sparkles, RotateCcw } from "lucide-react";

interface WorkspaceHeaderProps {
    mode: "analysis" | "customize";
    onSwitchMode: (mode: "analysis" | "customize") => void;
    onReset: () => void;
}

export function WorkspaceHeader({ mode, onSwitchMode, onReset }: WorkspaceHeaderProps) {
    return (
        <div className="flex justify-center items-center mb-10 relative z-20 gap-4">
             <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
                <button
                    onClick={() => onSwitchMode("analysis")}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        mode === "analysis" 
                            ? "bg-primary text-black shadow-lg shadow-primary/20" 
                            : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <ScanText className="w-3.5 h-3.5" />
                    Analyze
                </button>
                <button
                    onClick={() => onSwitchMode("customize")}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        mode === "customize" 
                            ? "bg-primary text-black shadow-lg shadow-primary/20" 
                            : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Customize
                </button>
             </div>

             <button
                onClick={onReset}
                title="Reset Session"
                className="h-11 px-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all group/reset flex items-center justify-center"
             >
                <RotateCcw className="w-4 h-4 text-primary group-hover/reset:-rotate-90 transition-all duration-500" />
             </button>
        </div>
    );
}
