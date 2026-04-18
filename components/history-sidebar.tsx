"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Clock, Plus } from "lucide-react";

interface Analysis {
  id: string;
  short_title: string;
  created_at: string;
}

export function HistorySidebar({ onSelect, selectedId }: { onSelect: (id: string | null) => void, selectedId: string | null }) {
  const [history, setHistory] = useState<Analysis[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("analyses")
          .select("id, short_title, created_at")
          .order("created_at", { ascending: false });
        
        if (data) setHistory(data);
      }
    }
    fetchHistory();
  }, [selectedId]); 

  return (
    <div className="w-[280px] bg-background/40 backdrop-blur-3xl border-r border-border/40 h-full flex flex-col shadow-[1px_0_20px_rgba(0,0,0,0.02)] z-10 shrink-0">
      
      <div className="p-5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 ${
            selectedId === null 
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[0.98]" 
              : "bg-background hover:bg-primary/10 text-foreground hover:text-primary shadow-sm border border-border/50"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      <div className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
        <Clock className="w-3 h-3 opacity-70" />
        Recent History
      </div>
      
      <div className="overflow-y-auto flex-1 px-3 pb-4 space-y-1 custom-scrollbar">
        {history.length === 0 && (
            <div className="text-center text-xs text-muted-foreground p-4 mt-2 border border-dashed border-border/50 rounded-xl bg-background/30">
                No past analyses found.
            </div>
        )}
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group flex flex-col gap-1 relative overflow-hidden ${
                selectedId === item.id 
                ? "bg-card shadow-sm border border-border/60" 
                : "bg-transparent border border-transparent hover:bg-card/50 hover:border-border/30"
            }`}
          >
            {selectedId === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            )}
            <div className={`text-sm font-medium truncate pl-1 ${selectedId === item.id ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                {item.short_title || "Untitled Analysis"}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pl-1 font-medium">
              <FileText className="w-3 h-3 opacity-40" />
              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
