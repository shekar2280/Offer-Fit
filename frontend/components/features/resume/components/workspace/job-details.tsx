import React, { useEffect, useRef } from "react";
import { Building2, Briefcase, MapPin, Clock } from "lucide-react";
import { FloatingInput } from "./floating-input";

interface JobDetailsProps {
    companyName: string;
    setCompanyName: (val: string) => void;
    position: string;
    setPosition: (val: string) => void;
    jobDescription: string;
    setJobDescription: (val: string) => void;
    location: string;
    setLocation: (val: string) => void;
    jobType: string;
    setJobType: (val: string) => void;
    selectedId: string | null;
    companyInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function JobDetails({
    companyName,
    setCompanyName,
    position,
    setPosition,
    jobDescription,
    setJobDescription,
    location,
    setLocation,
    jobType,
    setJobType,
    selectedId,
    companyInputRef,
}: JobDetailsProps) {
    const jdRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (jdRef.current) {
            jdRef.current.style.height = "auto";
            jdRef.current.style.height = `${jdRef.current.scrollHeight}px`;
        }
    }, [jobDescription]);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput 
                    value={companyName} 
                    onChange={setCompanyName} 
                    label="Target Company" 
                    disabled={!!selectedId} 
                    icon={Building2}
                    inputRef={companyInputRef}
                />
                <FloatingInput 
                    value={position} 
                    onChange={setPosition} 
                    label="Target Role" 
                    disabled={!!selectedId} 
                    icon={Briefcase} 
                />
                <FloatingInput 
                    value={location} 
                    onChange={setLocation} 
                    label="Job Location (e.g. Hyderabad)" 
                    disabled={!!selectedId} 
                    icon={MapPin} 
                />
                <FloatingInput 
                    value={jobType} 
                    onChange={setJobType} 
                    label="Job Type (e.g. Full-time, Internship)" 
                    disabled={!!selectedId} 
                    icon={Clock} 
                />
            </div>

            <div className="space-y-2 w-full">
                <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 ml-2">Job Description</h2>
                <div className="relative group/jd">
                    <textarea
                        ref={jdRef}
                        className="block w-full min-h-[140px] px-8 py-6 text-sm leading-relaxed text-white bg-white/[0.02] border border-white/10 rounded-[2rem] focus:outline-none focus:ring-0 focus:border-primary focus:bg-white/[0.04] transition-all resize-none no-scrollbar overflow-hidden"
                        placeholder="Paste the complete job description here to start analysis..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={!!selectedId}
                        spellCheck={false}
                        rows={1}
                    />
                </div>
            </div>
        </div>
    );
}
