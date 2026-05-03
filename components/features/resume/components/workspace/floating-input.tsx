import React from "react";

interface FloatingInputProps {
    value: string;
    onChange: (val: string) => void;
    label: string;
    disabled?: boolean;
    icon?: any;
}

export function FloatingInput({ value, onChange, label, disabled = false, icon: Icon }: FloatingInputProps) {
    return (
        <div className="relative group/input w-full bg-white/[0.02] border border-white/10 rounded-2xl transition-colors hover:border-white/20 focus-within:border-primary/50 focus-within:bg-white/[0.04]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors">
                {Icon && <Icon className="w-5 h-5" />}
            </div>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder=" "
                className="block w-full px-12 py-5 text-sm text-white bg-transparent appearance-none focus:outline-none focus:ring-0 peer disabled:opacity-50 h-16"
            />
            <label className="absolute text-sm text-white/40 duration-300 transform -translate-y-3 scale-75 top-4 left-12 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary pointer-events-none">
                {label}
            </label>
        </div>
    );
}
