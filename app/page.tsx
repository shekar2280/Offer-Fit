import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ResumeUpload } from "@/components/resume-upload";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">

        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-bold text-xl">
              <Link href={"/"}>ResumeAI Analyzer</Link>
            </div>
            <div className="flex items-center gap-4">
              <Suspense>
                <AuthButton />
              </Suspense>
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-12 max-w-5xl w-full p-5 py-20">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Analyze your Resume <br /> 
              <span className="text-primary font-serif">in Seconds.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upload your resume and let us give you 
              instant feedback on key skills, impact, and improvements.
            </p>
          </div>

          <div className="bg-accent/20 rounded-3xl p-8 border border-foreground/5 shadow-2xl">
            <ResumeUpload />
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t py-12 text-xs text-muted-foreground">
          <p>© 2026 ResumeAI Analyzer</p>
        </footer>
      </div>
    </main>
  );
}
