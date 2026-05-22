import React, { useState } from "react";
import { RotateCcw, AlertTriangle, X, ArrowRight, ShieldAlert, Zap } from "lucide-react";

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
    verdict?: string;
    missingSkills?: string[];
    redFlags?: string[];
}

export function ReportToolbar({
    isAnalyzing,
    serverError,
    mode,
    hasCustomization,
    onSwitchMode,
    onReset,
    isEditingForm,
    verdict,
    missingSkills = [],
    redFlags = []
}: ReportToolbarProps) {
    const [showDisclosure, setShowDisclosure] = useState(false);

    const handleCustomizeClick = () => {
        if (mode === "analysis" && !hasCustomization && verdict === "REJECT") {
            setShowDisclosure(true);
        } else {
            onSwitchMode(mode === "analysis" ? "customize" : "analysis");
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative z-[100] px-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${serverError ? 'bg-red-500' : 'bg-primary'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                    {serverError ? "Analysis Failed" : isAnalyzing ? "Scanning Resume" : "Analysis Complete"}
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                {!isAnalyzing && !isEditingForm && (
                    <button 
                        onClick={handleCustomizeClick}
                        className={`min-w-[200px] h-10 px-6 rounded-full border transition-all backdrop-blur-md group/mode flex items-center justify-center ${
                            mode === "analysis" 
                                ? (hasCustomization 
                                    ? "border-primary/40 bg-primary/10 hover:bg-primary/20 shadow-[0_0_20px_-5px_rgba(242,170,76,0.2)]" 
                                    : (verdict === "REJECT" 
                                        ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" 
                                        : "border-white/20 bg-black hover:bg-white/5")
                                ) 
                                : "border-primary/40 bg-primary/10 hover:bg-primary/20"
                        }`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
                            mode === "analysis"
                                ? (hasCustomization ? "text-primary" : (verdict === "REJECT" ? "text-destructive" : "text-white"))
                                : "text-primary"
                        }`}>
                            {mode === "analysis" 
                                ? (hasCustomization ? "View Tailored Resume" : (verdict === "REJECT" ? "⚠️ Customize (High Risk)" : "Customize Resume")) 
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

            {showDisclosure && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-xl bg-zinc-950 border border-destructive/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)] overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-destructive/10 blur-[80px] rounded-full" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-destructive font-black">Risk Disclosure</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">Fundamental <span className="text-destructive">Gaps</span> Detected.</h2>
                                </div>
                                <button 
                                    onClick={() => setShowDisclosure(false)}
                                    className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/20 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed">
                                Our AI has flagged significant mismatches between your background and the job requirements. Customizing this resume is unlikely to pass professional screening without substantial manual upskilling.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Zap className="w-3 h-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Critical Gaps</span>
                                    </div>
                                    <div className="space-y-2">
                                        {missingSkills.slice(0, 5).map((skill, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                                                <div className="w-1 h-1 rounded-full bg-destructive" />
                                                {skill}
                                            </div>
                                        ))}
                                        {missingSkills.length === 0 && <span className="text-xs text-white/20">No specific skills flagged</span>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Red Flags</span>
                                    </div>
                                    <div className="space-y-2">
                                        {redFlags.slice(0, 5).map((flag, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                                                <div className="w-1 h-1 rounded-full bg-destructive/50" />
                                                {flag}
                                            </div>
                                        ))}
                                        {redFlags.length === 0 && <span className="text-xs text-white/20">No major red flags</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <button 
                                    onClick={() => setShowDisclosure(false)}
                                    className="w-full sm:w-auto px-8 h-12 rounded-2xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowDisclosure(false);
                                        onSwitchMode("customize");
                                    }}
                                    className="w-full flex-1 h-12 rounded-2xl bg-destructive text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-destructive/20 flex items-center justify-center gap-3"
                                >
                                    Proceed Anyway
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
