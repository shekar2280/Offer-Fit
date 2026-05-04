import React, { useState, useEffect } from "react";
import { FileText, Cpu, Globe, Search, Scale, CheckCircle2 } from "lucide-react";

interface LoadingScanningProps {
    mode: "analysis" | "customize";
}

const AGENT_STEPS = [
    { text: "Initializing Agentic Reasoning Loop...", icon: Cpu },
    { text: "Searching Tavily for deep company intel...", icon: Globe },
    { text: "Fetching live market & salary data...", icon: Search },
    { text: "Synthesizing strategy against Job Description...", icon: FileText },
    { text: "Judge evaluating output for tactical depth...", icon: Scale },
    { text: "Finalizing high-fidelity Markdown report...", icon: CheckCircle2 }
];

export function LoadingScanning({ mode }: LoadingScanningProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < AGENT_STEPS.length - 1 ? prev + 1 : prev));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full py-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_4s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border-t border-primary/40 animate-[spin_2s_linear_infinite_reverse]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                        <div className="relative flex items-center justify-center">
                            <Cpu className="w-10 h-10 text-primary animate-pulse" />
                            <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                                <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(242,170,76,1)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 w-full max-w-md">
                {AGENT_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div 
                            key={index}
                            className={`flex items-center gap-4 transition-all duration-700 ${
                                isActive ? "opacity-100 translate-x-0" : 
                                isCompleted ? "opacity-40 translate-x-0" : "opacity-0 -translate-x-4"
                            }`}
                        >
                            <div className={`p-2 rounded-lg border ${
                                isActive ? "bg-primary/20 border-primary/50 text-primary animate-pulse" :
                                isCompleted ? "bg-white/5 border-white/10 text-white/50" : "bg-transparent border-transparent text-transparent"
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className={`text-xs font-mono uppercase tracking-widest ${
                                isActive ? "text-primary font-bold shadow-primary/50" :
                                isCompleted ? "text-white/40 font-medium" : "text-transparent"
                            }`}>
                                {step.text}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
