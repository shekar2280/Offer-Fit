import React from "react";

interface ReportToolbarProps {
    isAnalyzing: boolean;
    serverError: string | null;
    mode: "analysis" | "customize";
    hasCustomization: boolean;
    isHistoryMode: boolean;
    onSwitchMode: (newMode: "analysis" | "customize") => void;
    onReset: () => void;
}

export function ReportToolbar({
    isAnalyzing,
    serverError,
    mode,
    hasCustomization,
    isHistoryMode,
    onSwitchMode,
    onReset
}: ReportToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative z-30 px-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${serverError ? 'bg-red-500' : 'bg-primary'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                    {serverError ? "Analysis Failed" : isAnalyzing ? "Scanning Resume" : "Analysis Complete"}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {!isAnalyzing && (
                    <button 
                        onClick={() => onSwitchMode(mode === "analysis" ? "customize" : "analysis")}
                        className="min-w-[160px] h-10 px-6 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all backdrop-blur-md group/mode flex items-center justify-center"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {mode === "analysis" 
                                ? (hasCustomization ? "Show Customized Resume" : "Customize Resume") 
                                : "Show Analysis Report"
                            }
                        </span>
                    </button>
                )}
                {!isHistoryMode && (
                    <button 
                        onClick={onReset} 
                        className="h-10 px-6 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 transition-all group/reset backdrop-blur-md flex items-center justify-center"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/reset:text-white/80 transition-colors">
                            Reset
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
