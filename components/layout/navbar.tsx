"use client";

import { useState, useEffect } from "react";
import { Menu, Archive, User, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logoIcon from "@/assets/icon.png";
import { useAnalysis } from "@/lib/context/analysis-context";
import { USAGE_LIMITS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
    username: string;
    onMenuClick?: () => void;
    showMenuButton?: boolean;
    usage?: { daily_count: number; last_request_at: string | null } | null;
}

export function Navbar({
    username: _username,
    onMenuClick,
    showMenuButton = true,
    usage = null,
}: NavbarProps) {
    const { resetSession } = useAnalysis();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const [clientUsage, setClientUsage] = useState<{ daily_count: number; last_request_at: string | null } | null>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("resume_ai_usage");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return null;
                }
            }
        }
        return null;
    });

    useEffect(() => {
        if (usage) {
            setClientUsage(usage);
            localStorage.setItem("resume_ai_usage", JSON.stringify(usage));
            return;
        }

        const fetchUsage = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: usageData } = await supabase
                    .from("user_usage")
                    .select("daily_count, last_request_at")
                    .eq("user_id", user.id)
                    .single();
                if (usageData) {
                    setClientUsage(usageData);
                    localStorage.setItem("resume_ai_usage", JSON.stringify(usageData));
                }
            }
        };

        fetchUsage();
    }, [usage]);

    const getDailyCount = () => {
        if (!clientUsage) return null;
        const msSinceLast = clientUsage.last_request_at ? Date.now() - new Date(clientUsage.last_request_at).getTime() : 0;
        return msSinceLast > USAGE_LIMITS.DAILY_REFRESH_MS ? 0 : clientUsage.daily_count;
    };

    const dailyCount = getDailyCount();
    const remainingCredits = dailyCount !== null ? Math.max(0, USAGE_LIMITS.DAILY_QUOTA - dailyCount) : null;
    const isOutOfCredits = mounted && remainingCredits === 0;

    return (
        <header className="w-full h-[68px] shrink-0 sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]">
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, #F2AA4C40, transparent)" }}
            />

            <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between max-w-[1600px] mx-auto gap-4">

                <div className="flex items-center gap-3 flex-none">
                    {showMenuButton && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}

                    <Link href="/" className="flex items-center gap-2.5 group" onClick={() => resetSession()}>
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transition-shadow duration-300 group-hover:shadow-[0_0_16px_4px_rgba(242,170,76,0.3)]"
                            style={{ background: "linear-gradient(135deg, #101820, #1e2a3a)", border: "1px solid rgba(242,170,76,0.2)" }}
                        >
                            <Image src={logoIcon} alt="Resume AI" width={20} height={20} className="object-contain" />
                        </div>
                        <div className="flex items-baseline gap-1 font-black text-xl tracking-tighter">
                            <span className="text-white">Resume</span>
                            <span className="font-serif italic font-light" style={{ color: "#F2AA4C" }}>AI</span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-2.5 flex-none">
                    <div className={`flex items-center gap-1.5 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)] rounded-full px-3.5 py-1.5 transition-all duration-500 ${isOutOfCredits
                            ? "bg-rose-950/40 border border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:bg-rose-950/60 hover:border-rose-500/50"
                            : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]"
                        }`}>
                        <Sparkles className={`w-3.5 h-3.5 ${isOutOfCredits ? "text-rose-400 animate-pulse" : "text-[#F2AA4C]"}`} />
                        <span className="text-xs font-bold tracking-wide">
                            {mounted && remainingCredits !== null ? (
                                remainingCredits === 0 ? (
                                    <span className="text-rose-400 uppercase tracking-widest text-[9px] font-black">
                                        No Credits Remaining
                                    </span>
                                ) : (
                                    <span className="text-white/80">
                                        <span className="text-white font-extrabold">{remainingCredits}</span>
                                        <span className="text-white/30 mx-1">/</span>
                                        <span className="text-white/40">{USAGE_LIMITS.DAILY_QUOTA} Credits</span>
                                    </span>
                                )
                            ) : (
                                <span className="text-white/30 animate-pulse">-- Credits</span>
                            )}
                        </span>
                    </div>

                    <Link
                        href="/history"
                        className="flex items-center gap-2 h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                    >
                        <Archive className="w-3.5 h-3.5 text-primary group-hover:text-primary transition-colors" />
                    </Link>

                    <Link
                        href="/profile"
                        title="Profile"
                        className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                    >
                        <User className="w-4 h-4 text-primary" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
