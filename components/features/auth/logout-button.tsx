"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div title="Logout" className="flex items-center justify-center">
      <LogOut 
        onClick={logout} 
        className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-all hover:scale-110 active:scale-95" 
      />
    </div>
  );
}
