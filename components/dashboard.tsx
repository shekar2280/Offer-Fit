"use client";

import { useState } from "react";
import { HistorySidebar } from "./history-sidebar";
import { ResumeUpload } from "./resume-upload";

export function Dashboard() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="flex-1 w-full h-screen overflow-hidden relative bg-background flex selection:bg-primary/30 selection:text-primary">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-20 h-full backdrop-blur-3xl bg-black/40 border-r border-white/5 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
                <HistorySidebar onSelect={(id) => setSelectedId(id)} selectedId={selectedId} />
            </div>

            <main className="flex-1 h-full overflow-y-auto no-scrollbar relative z-10">
                <div className="min-h-full flex items-start justify-center p-4 lg:p-4 w-full">
                    <ResumeUpload selectedId={selectedId} onReset={() => setSelectedId(null)} />
                </div>
            </main>
        </div>
    );
}
