import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Dashboard } from "@/components/dashboard";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">

      <nav className="w-full flex justify-center border-b border-border/40 h-[72px] shrink-0 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="w-full px-8 flex justify-between items-center text-sm max-w-[1600px]">

          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <Link href={"/"} className="hover:opacity-80 transition-opacity flex items-baseline">
              Resume<span className="text-primary font-serif italic font-light pr-1 text-2xl">AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Suspense>
              <AuthButton />
            </Suspense>
            <div className="w-px h-6 bg-border/50"></div>
            <ThemeSwitcher />
          </div>

        </div>
      </nav>


      <div className="flex-1 w-full max-w-[1600px] mx-auto flex overflow-hidden">
        <Dashboard />
      </div>

    </main>
  );
}
