import Link from "next/link";
import { Button } from "./ui/button";
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
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
