"use client";

import React, { useState, useEffect } from "react";
import { Cpu } from "lucide-react";

interface LoadingScanningProps {
    mode?: "analysis" | "customize";
    showText?: boolean;
}

const ANALYSIS_STEPS = [
    { text: "Starting AI Analysis..." },
    { text: "Researching Company Intel..." },
    { text: "Checking Market Trends..." },
    { text: "Matching Resume to Job..." },
    { text: "Reviewing Final Report..." },
    { text: "Generating Analysis..." }
];

const CUSTOMIZE_STEPS = [
    { text: "Reading Master Resume..." },
    { text: "Checking Job Keywords..." },
    { text: "Tailoring Experience..." },
    { text: "Updating Summary..." },
    { text: "Refining LaTeX Code..." },
    { text: "Finalizing tailored version..." }
];

export function LoadingScanning({ mode = "analysis", showText = true }: LoadingScanningProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = mode === "customize" ? CUSTOMIZE_STEPS : ANALYSIS_STEPS;

    useEffect(() => {
        if (!showText) return;
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    }, [steps.length, showText]);

    return (
        <div className={`w-full flex flex-col items-center justify-center relative ${showText ? 'py-24 min-h-[600px]' : 'py-12'}`}>
            <div className={`relative flex items-center justify-center ${showText ? 'w-80 h-80 mb-20' : 'w-48 h-48'}`}>
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                
                <div className="absolute w-full h-full border border-white/5 rounded-full" />
                <div className="absolute w-[75%] h-[75%] border border-white/5 rounded-full" />
                <div className="absolute w-[50%] h-[50%] border border-white/5 rounded-full" />

                <div className="absolute w-full h-full animate-[spin_4s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(242,170,76,1)]" />
                </div>
                <div className="absolute w-[75%] h-[75%] animate-[spin_3s_linear_infinite_reverse]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
                </div>
                <div className="absolute w-[50%] h-[50%] animate-[spin_6s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/40 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                </div>

                <div className={`relative flex items-center justify-center ${showText ? 'w-28 h-28' : 'w-16 h-16'}`}>
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl flex items-center justify-center">
                        <div className="relative">
                            <Cpu className={`${showText ? 'w-10 h-10' : 'w-6 h-6'} text-primary animate-pulse`} />
                            <div className={`absolute -top-1 -right-1 rounded-full bg-primary animate-ping ${showText ? 'w-3 h-3' : 'w-2 h-2'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {showText && (
                <div className="flex flex-col items-center space-y-6 w-full max-w-lg">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        if (!isActive && !isCompleted) return null;

                        return (
                            <div 
                                key={index}
                                className={`flex flex-col items-center gap-2 transition-all duration-1000 ${
                                    isActive ? "opacity-100 scale-100" : "opacity-30 scale-95"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-primary animate-ping' : 'bg-white/20'}`} />
                                    <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${
                                        isActive ? "text-primary" : "text-white/40"
                                    }`}>
                                        {step.text}
                                    </span>
                                </div>
                                {isActive && (
                                    <div className="h-0.5 w-12 bg-primary/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-[loading_2.5s_ease-in-out_infinite]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
