"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020202]">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
