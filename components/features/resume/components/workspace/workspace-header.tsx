import React from "react";
import { X } from "lucide-react";

interface WorkspaceHeaderProps {
    onReset: () => void;
}

export function WorkspaceHeader({ onReset }: WorkspaceHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6 relative z-20">
             <div />
             <button 
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[9px] font-bold uppercase tracking-widest text-white/30 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300 group/reset"
             >
                <X className="w-3 h-3 group-hover/reset:rotate-90 transition-transform duration-300" />
                Reset
             </button>
        </div>
    );
}
