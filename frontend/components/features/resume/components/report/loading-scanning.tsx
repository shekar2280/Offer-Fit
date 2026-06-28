"use client";

import React, { useState, useEffect } from "react";

interface LoadingScanningProps {
    mode?: "analysis" | "customize";
    showText?: boolean;
    companyName?: string;
    position?: string;
    userName?: string;
}

function getAnalysisSteps(company?: string, position?: string) {
    const role = position || "the role";
    const co = company || "the company";
    return [
        { text: `Loading resume...` },
        { text: `Fetching job description...` },
        { text: `Researching ${co}...` },
        { text: `Scanning resume sections...` },
        { text: `Matching skills to JD...` },
        { text: `Computing match score...` },
        { text: `Evaluating red flags...` },
        { text: `Drafting interview prep...` },
        { text: `Generating strategy...` },
        { text: `Finalizing report...` },
    ];
}

function getCustomizeSteps(company?: string, position?: string) {
    const role = position || "the role";
    const co = company || "the company";
    return [
        { text: `Reading resume structure...` },
        { text: `Parsing job description...` },
        { text: `Researching ${co} culture...` },
        { text: `Identifying ATS keywords...` },
        { text: `Analyzing ${role} requirements...` },
        { text: `Tailoring bullet points...` },
        { text: `Injecting keywords...` },
        { text: `Optimizing impact statements...` },
        { text: `Formatting output...` },
        { text: `Finalizing tailored version...` },
    ];
}

export function LoadingScanning({
    mode = "analysis",
    showText = true,
    companyName,
    position,
}: LoadingScanningProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [dots, setDots] = useState("");

    const steps = mode === "customize"
        ? getCustomizeSteps(companyName, position)
        : getAnalysisSteps(companyName, position);

    const isLastStep = currentStep === steps.length - 1;

    useEffect(() => {
        if (!showText) return;
        setCurrentStep(0);
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1800);
        return () => clearInterval(interval);
    }, [steps.length, showText, mode, position, companyName]);

    useEffect(() => {
        if (!isLastStep) {
            setDots("");
            return;
        }
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 400);
        return () => clearInterval(interval);
    }, [isLastStep]);

    return (
        <div className={`w-full flex flex-col items-center justify-center relative ${showText ? "py-24 min-h-[600px]" : "py-12"}`}>
            {showText && (
                <div className="flex flex-col items-center space-y-5 w-full max-w-lg">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        if (!isActive && !isCompleted) return null;

                        return (
                            <div
                                key={index}
                                className={`flex flex-col items-center gap-2 transition-all duration-700 ${isActive ? "opacity-100 scale-100" : "opacity-25 scale-95"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-1 rounded-full ${isActive ? "bg-primary animate-ping" : "bg-white/20"}`} />
                                    <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${isActive ? "text-primary" : "text-white/30"}`}>
                                        {isActive && isLastStep
                                            ? `${step.text.replace(/\.\.\.$/, "")}${dots}`
                                            : step.text}
                                    </span>
                                </div>
                                {isActive && (
                                    <div className="h-0.5 w-12 bg-primary/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-[loading_1.8s_ease-in-out_infinite]" />
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
