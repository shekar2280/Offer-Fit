import React from "react";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

export function FeatureCard({ icon, title, desc }: FeatureCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}
