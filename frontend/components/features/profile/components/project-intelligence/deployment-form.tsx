"use client";

import { POPULAR_HOSTING_OPTIONS } from "@/lib/constants";

const COMPONENT_OPTIONS = ["Frontend", "Backend", "Database", "Full Stack", "Other (Custom)"];

interface DeploymentFormProps {
    component: string;
    setComponent: (val: string) => void;
    customComponent: string;
    setCustomComponent: (val: string) => void;
    platform: string;
    setPlatform: (val: string) => void;
    customPlatform: string;
    setCustomPlatform: (val: string) => void;
    onAdd: () => void;
    compact?: boolean;
}

export function DeploymentForm({
    component,
    setComponent,
    customComponent,
    setCustomComponent,
    platform,
    setPlatform,
    customPlatform,
    setCustomPlatform,
    onAdd,
    compact = false,
}: DeploymentFormProps) {
    const selectCls = compact
        ? "w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
        : "w-full bg-zinc-900/50 border border-primary/20 hover:border-primary/45 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-primary/70 focus:outline-none";
    const inputCls = compact
        ? "w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
        : "w-full mt-1.5 bg-zinc-900/50 border border-primary/20 hover:border-primary/45 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-primary/70 focus:outline-none";

    return (
        <div className={compact ? "space-y-1" : "flex flex-wrap md:flex-nowrap gap-2 items-start bg-zinc-950/40 border border-primary/20 p-3 rounded-xl"}>
            <div className={compact ? "w-full" : "w-full md:w-1/3"}>
                {!compact && <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase">Component</label>}
                <select
                    value={component}
                    onChange={(e) => {
                        setComponent(e.target.value);
                        if (e.target.value !== "Other (Custom)") setCustomComponent("");
                    }}
                    className={selectCls}
                >
                    {COMPONENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                {component === "Other (Custom)" && (
                    <input
                        type="text"
                        value={customComponent}
                        onChange={(e) => setCustomComponent(e.target.value)}
                        placeholder="e.g. Messaging..."
                        className={inputCls}
                    />
                )}
            </div>

            <div className={compact ? "w-full" : "w-full md:w-2/3"}>
                {!compact && <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase">Platform</label>}
                <select
                    value={platform}
                    onChange={(e) => {
                        setPlatform(e.target.value);
                        if (e.target.value !== "Other (Custom)") setCustomPlatform("");
                    }}
                    className={selectCls}
                >
                    <option value="">{compact ? "Platform" : "Select Platform"}</option>
                    {POPULAR_HOSTING_OPTIONS.filter((o) => o !== "Other (Custom)").map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Other (Custom)">Other (Custom)</option>
                </select>
                {platform === "Other (Custom)" && (
                    <input
                        type="text"
                        value={customPlatform}
                        onChange={(e) => setCustomPlatform(e.target.value)}
                        placeholder="Custom platform..."
                        className={inputCls}
                    />
                )}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className={
                    compact
                        ? "w-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold py-1 rounded"
                        : "self-end bg-primary hover:bg-primary/80 text-black font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase shrink-0 transition-colors mt-4 md:mt-0"
                }
            >
                {compact ? "+ Add to list" : "Add"}
            </button>
        </div>
    );
}
