"use client";

import { useState, useEffect, useRef } from "react";
import { HistorySidebar } from "./history-sidebar";
import { ResumeUpload } from "./resume-upload";
import { Menu, X, Sparkles, UserCircle } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function Dashboard({ user }: { user: any }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (id: string | null) => {
        setSelectedId(id);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [selectedId]);

    const username = user?.email?.split('@')[0] || "User";

    return (
        <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
            <header className="w-full h-[72px] shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
                <div className="w-full px-4 sm:px-6 h-full flex justify-between items-center text-sm max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 font-black text-2xl tracking-tighter">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-primary transition-colors shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                                <Sparkles className="w-4 h-4 text-secondary" />
                            </div>

                            <Link href={"/"} className="hover:opacity-80 transition-opacity flex items-baseline">
                                <span className="hidden md:block">Resume</span>
                                <span className="text-primary font-serif italic font-light pr-1 text-2xl">AI</span>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 justify-end flex-1">
                        <Link
                            href="/protected/profile"
                            className="flex items-center justify-center sm:justify-start gap-2 bg-white/5 h-9 px-3 rounded-full border border-white/10 text-foreground transition-all hover:bg-white/10 hover:border-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group"
                        >
                            <div className="relative">
                                <UserCircle className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />
                            </div>
                            <span className="text-xs font-medium hidden sm:inline-block truncate max-w-[100px]">
                                {username}
                            </span>
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <div className="flex-1 w-full max-w-[1600px] mx-auto flex overflow-hidden relative">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className={`
                    fixed inset-y-0 left-0 z-[60] lg:relative lg:inset-auto lg:z-20 
                    w-[75%] sm:w-[40%] lg:w-[80px] lg:hover:w-[300px]
                    h-full backdrop-blur-3xl bg-black/95 lg:bg-black/40 
                    transition-all duration-500 ease-in-out group/sidebar
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <HistorySidebar onSelect={handleSelect} selectedId={selectedId} />
                </div>

                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <main
                    ref={scrollContainerRef}
                    className="flex-1 h-full overflow-y-auto no-scrollbar relative z-10"
                >
                    <div className="min-h-full flex items-start justify-center px-4 pb-4 lg:px-10 lg:pb-10 pt-0 w-full">
                        <ResumeUpload selectedId={selectedId} onReset={() => handleSelect(null)} />
                    </div>
                </main>
            </div>
        </div>
    );
}
