"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAnalysisSession } from "@/components/features/resume/hooks/use-analysis-session";
import { ResumeFeature } from "@/components/features/resume/resume-feature";
import { useSearchParams } from "next/navigation";

const SimpleSpinner = () => (
    <div className="h-screen w-full flex items-center justify-center bg-[#020202]">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
    </div>
);

export default function CustomizePage() {
    return (
        <Suspense fallback={<SimpleSpinner />}>
            <CustomizePageContent />
        </Suspense>
    );
}

function CustomizePageContent() {
    const { session } = useAnalysisSession();
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || null;

    return (
        <AuthGuard>
            <ResumeFeature
                mode="customize"
                selectedId={id || undefined}
                initialData={{
                    companyName: session.companyName,
                    position: session.position,
                    jd: session.jd,
                    location: session.location,
                    jobType: session.jobType,
                }}
            />
        </AuthGuard>
    );
}
