"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect, useRef } from "react";
import { createClient } from "@/services/supabase/client";
import { hasEnvVars } from "@/lib/utils";
import { type AuthChangeEvent, type Session } from "@supabase/supabase-js";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number })?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            structuralSharing: true,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );
  const currentUser=useRef<string|null>(null);
  useEffect(()=>{
    if(!hasEnvVars)return;
    const {data:{subscription}}=createClient().auth.onAuthStateChange((event: AuthChangeEvent,session: Session|null)=>{
      const next=session?.user.id||null;
      if(currentUser.current!==next){queryClient.clear();currentUser.current=next;}
      if(event==='SIGNED_OUT')window.postMessage({type:'FROM_WEB_APP',action:'CLEAR_WORKSPACE'},window.location.origin);
    });
    return ()=>subscription.unsubscribe();
  },[queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

