import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden selection:bg-primary/30 selection:text-primary font-sans">
      
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[45%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="p-8 sm:p-12 relative z-10">
        <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tighter text-white">Resume</span>
                <span className="text-primary font-serif italic font-light text-2xl">AI</span>
            </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
        </div>
      </main>

      <footer className="p-8 text-center relative z-10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">
          Elevate Your Career • Powered by ResumeAI
        </p>
      </footer>
    </div>
  );
}
