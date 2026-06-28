"use client";

import { createClient } from "@/services/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    sessionStorage.removeItem("offerfit_welcome_seen");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <button
      onClick={logout}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium transition-all bg-white/5 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
}
