"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAnalysisSession } from "@/components/features/resume/hooks/use-analysis-session";
import { ResumeFeature } from "@/components/features/resume/resume-feature";

const SimpleSpinner = () => (
    <div className="h-screen w-full flex items-center justify-center bg-[#020202]">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
    </div>
);

export default function AnalyzePage() {
    return (
        <Suspense fallback={<SimpleSpinner />}>
            <AnalyzePageContent />
        </Suspense>
    );
}

function AnalyzePageContent() {
    const { session } = useAnalysisSession();

    return (
        <AuthGuard>
            <AnalyzeContent 
                id={session.id} 
                companyName={session.companyName}
                position={session.position}
                jd={session.jd}
                location={session.location}
                jobType={session.jobType}
            />
        </AuthGuard>
    );
}

function AnalyzeContent({ id, companyName, position, jd, location, jobType }: any) {
    return (
        <ResumeFeature 
            mode="analysis" 
            selectedId={id || undefined}
            initialData={{ companyName, position, jd, location, jobType }}
        />
    );
}
