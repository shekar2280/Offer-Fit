import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { UserCircle } from "lucide-react";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  const username = user?.email?.split('@')[0] || "User";

  return user ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center sm:justify-start gap-2 bg-white/5 w-9 h-9 sm:w-auto sm:h-9 sm:px-3 rounded-full border border-white/10 text-foreground transition-all hover:bg-white/10 hover:border-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)] shrink-0">
        <UserCircle className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium hidden sm:inline-block uppercase tracking-widest">{username}</span>
      </div>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-4">
      <Link 
        href="/auth/login" 
        className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center px-4"
      >
        Sign In
      </Link>
      <Link 
        href="/auth/sign-up" 
        className="h-9 px-5 bg-white/5 hover:bg-white/10 text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] rounded-full border border-white/10 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center"
      >
        Get Started
      </Link>
    </div>
  );
}
