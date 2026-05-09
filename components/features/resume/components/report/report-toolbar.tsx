import React from "react";
import { Edit3, FileSearch, RotateCcw } from "lucide-react";

interface ReportToolbarProps {
    isAnalyzing: boolean;
    serverError: string | null;
    mode: "analysis" | "customize";
    hasCustomization: boolean;
    isHistoryMode: boolean;
    onSwitchMode: (newMode: "analysis" | "customize") => void;
    onReset: () => void;
    isEditingForm: boolean;
    onToggleForm: () => void;
}

export function ReportToolbar({
    isAnalyzing,
    serverError,
    mode,
    hasCustomization,
    isHistoryMode,
    onSwitchMode,
    onReset,
    isEditingForm,
    onToggleForm
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
                        onClick={onToggleForm}
                        className="h-10 px-6 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/20 transition-all backdrop-blur-md flex items-center gap-2 group/toggle"
                    >
                        {isEditingForm ? (
                            <>
                                <FileSearch className="w-3.5 h-3.5 text-primary group-hover/toggle:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">View Report</span>
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-3.5 h-3.5 text-primary group-hover/toggle:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Edit Details</span>
                            </>
                        )}
                    </button>
                )}

                {!isAnalyzing && !isEditingForm && (
                    <button 
                        onClick={() => onSwitchMode(mode === "analysis" ? "customize" : "analysis")}
                        className={`min-w-[200px] h-10 px-6 rounded-full border transition-all backdrop-blur-md group/mode flex items-center justify-center ${
                            mode === "analysis" 
                                ? (hasCustomization 
                                    ? "border-primary/40 bg-primary/10 hover:bg-primary/20 shadow-[0_0_20px_-5px_rgba(242,170,76,0.2)]" 
                                    : "border-white/20 bg-black hover:bg-white/5"
                                ) 
                                : "border-primary/40 bg-primary/10 hover:bg-primary/20"
                        }`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
                            mode === "analysis"
                                ? (hasCustomization ? "text-primary" : "text-white")
                                : "text-primary"
                        }`}>
                            {mode === "analysis" 
                                ? (hasCustomization ? "View Tailored Resume" : "Customize Resume") 
                                : "View Analysis Report"
                            }
                        </span>
                    </button>
                )}

                {!isAnalyzing && (
                    <button
                        onClick={onReset}
                        title="Reset Session"
                        className="h-11 px-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all group/reset flex items-center justify-center"
                    >
                        <RotateCcw className="w-4 h-4 text-primary group-hover/reset:-rotate-90 transition-all duration-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
