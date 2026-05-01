import { ResumeFeature } from "@/components/features/resume/resume-feature";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function CustomizePage(props: {
    searchParams: Promise<{ id?: string }>
}) {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-background animate-pulse" />}>
            <CustomizeContent {...props} />
        </Suspense>
    );
}

async function CustomizeContent({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { id } = await searchParams;

    return <ResumeFeature mode="customize" selectedId={id} />;
}
