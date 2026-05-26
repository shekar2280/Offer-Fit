"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020202]">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
