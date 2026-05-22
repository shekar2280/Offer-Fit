"use client";

import { Menu, Archive, User, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logoIcon from "@/assets/icon.png";
import { useAnalysis } from "@/lib/context/analysis-context";
import { USAGE_LIMITS } from "@/lib/constants";

interface NavbarProps {
    username: string;
    onMenuClick?: () => void;
    showMenuButton?: boolean;
    usage?: { daily_count: number; hourly_count: number; last_request_at: string | null } | null;
}

export function Navbar({
    username: _username,
    onMenuClick,
    showMenuButton = true,
    usage = null,
}: NavbarProps) {
    const { resetSession } = useAnalysis();

    const getDailyCount = () => {
        if (!usage) return 0;
        const msSinceLast = usage.last_request_at ? Date.now() - new Date(usage.last_request_at).getTime() : 0;
        return msSinceLast > USAGE_LIMITS.DAILY_REFRESH_MS ? 0 : usage.daily_count;
    };
    
    const dailyCount = getDailyCount();
    const remainingCredits = Math.max(0, USAGE_LIMITS.DAILY_QUOTA - dailyCount);

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

                <div className="flex-1 flex justify-center">
                    {usage && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_0_12px_rgba(255,255,255,0.02)] rounded-full px-3 py-1.5 transition-all hover:bg-white/[0.05] hover:border-white/[0.15]">
                            <Sparkles className="w-3.5 h-3.5 text-[#F2AA4C]" />
                            <span className="text-xs font-medium tracking-wide text-white/80">
                                <span className={remainingCredits === 0 ? "text-red-400" : "text-white"}>{remainingCredits}</span>
                                <span className="text-white/40 mx-1">/</span>
                                {USAGE_LIMITS.DAILY_QUOTA} Credits
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-none">
                    <Link
                        href="/history"
                        className="flex items-center gap-2 h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                    >
                        <Archive className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/20 group-hover:text-white/80 hidden sm:block">Archive</span>
                    </Link>

                    <div className="w-px h-4 bg-white/10 mx-1" />

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
