"use client";

import { UserCircle, Menu, Archive } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "../features/auth/logout-button";
import logoIcon from "@/assets/icon.png";

interface NavbarProps {
    username: string;
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function Navbar({ username, onMenuClick, showMenuButton = true }: NavbarProps) {
    return (
        <header className="w-full h-[72px] shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
            <div className="w-full px-4 sm:px-6 h-full flex justify-between items-center text-sm max-w-[1600px] mx-auto">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 font-black text-2xl tracking-tighter flex-none">
                        {showMenuButton && (
                            <button
                                onClick={onMenuClick}
                                className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-primary transition-colors shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}

                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                            <Image 
                                src={logoIcon} 
                                alt="Resume AI Logo" 
                                width={24} 
                                height={24} 
                                className="object-contain"
                            />
                        </div>

                        <Link href={"/"} className="hover:opacity-80 transition-opacity flex items-baseline gap-1">
                            <span className="inline-block text-white">Resume</span>
                            <span className="text-primary font-serif italic font-light text-2xl">AI</span>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 justify-end flex-1">
                    <Link
                        href="/history"
                        className="flex items-center justify-center gap-2 bg-white/5 h-9 px-3 rounded-full border border-white/10 text-foreground transition-all hover:bg-white/10 hover:border-primary/30 hover:text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] group"
                        title="Archive History"
                    >
                        <Archive className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span className="text-xs font-medium hidden sm:inline-block">Archive</span>
                    </Link>
                    
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
    );
}
