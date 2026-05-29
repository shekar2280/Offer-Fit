import Link from "next/link";
import { Check } from "lucide-react";

export default function Page() {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="bg-white/[0.01] border border-white/[0.03] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(242,170,76,0.3)] animate-in zoom-in duration-500">
              <Check className="w-8 h-8 text-black" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
              Check Your Email
            </h1>
            <p className="text-sm text-white/40 font-medium leading-relaxed">
              We&apos;ve sent a confirmation link to your inbox. Please verify your account to start optimizing your resume.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_rgba(242,170,76,0.2)]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
