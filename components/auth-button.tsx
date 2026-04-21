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
      <div className="flex items-center gap-2 bg-secondary/50 py-2 px-3 rounded-full border border-border/50 text-foreground">
        <UserCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{username}</span>
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
