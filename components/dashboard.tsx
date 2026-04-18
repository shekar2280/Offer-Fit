"use client";

import { useState } from "react";
import { HistorySidebar } from "./history-sidebar";
import { ResumeUpload } from "./resume-upload";

export function Dashboard() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="flex-1 w-full flex overflow-hidden">
            <HistorySidebar onSelect={(id) => setSelectedId(id)} selectedId={selectedId} />
            <main className="flex-1 overflow-y-auto">
                <div className="flex-1 flex flex-col gap-12 max-w-5xl w-full p-5 py-20 mx-auto">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                            Analyze your Resume <br />
                            <span className="text-primary font-serif">in Seconds.</span>
                        </h1>
                    </div>
                    
                    <div className="bg-accent/20 rounded-3xl p-8 border border-foreground/5 shadow-2xl">
                        <ResumeUpload selectedId={selectedId} />
                    </div>
                </div>
            </main>
        </div>
    );
}
