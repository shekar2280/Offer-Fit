import React from 'react';
import { Target, AlertCircle, Copy, DollarSign, BookOpen, Brain, Briefcase, Zap, Shield, TrendingUp } from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, subtitle, color = "primary" }: { icon: any, title: string, subtitle?: string, color?: string }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className={`p-3 rounded-2xl bg-${color}/10 border border-${color}/20`}>
            <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <div>
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/80">{title}</h3>
            {subtitle && <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const DossierCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`relative overflow-hidden bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 transition-all hover:bg-white/[0.02] hover:border-white/10 ${className}`}>
        {children}
    </div>
);

const MetricCard = ({ label, value, unit, color, progress, subtitle }: { label: string, value: string | number, unit: string, color: string, progress: number, subtitle?: string }) => {
    const valueStr = String(value);
    const isLongValue = valueStr.length > 8;
    
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-5 transition-all hover:bg-white/[0.03] hover:border-white/10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 shrink-0">{label}</span>
                <div className="flex items-baseline gap-1 min-w-0">
                    <span className={`font-black text-white leading-none tracking-tighter truncate ${
                        isLongValue ? 'text-lg sm:text-xl' : 'text-3xl'
                    }`}>
                        {value}
                    </span>
                    <span className={`text-[10px] font-black uppercase shrink-0 ${color === 'primary' ? 'text-primary/60' : 'text-emerald-500/60'}`}>{unit}</span>
                </div>
            </div>
            <div className="space-y-4">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${progress}%`, backgroundColor: color === 'primary' ? '#f2aa4c' : '#10b981' }} 
                    />
                </div>
                {subtitle && (
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

export function ScoreMetrics({ insights }: { insights: any }) {
    if (!insights) return null;
    return (
        <>
            <MetricCard 
                label="ATS Match" 
                value={insights.ats_score || 0} 
                unit="%" 
                color="primary" 
                progress={insights.ats_score || 0} 
                subtitle="Keyword alignment"
            />
            <MetricCard 
                label="Semantic" 
                value={insights.keyword_density || 0} 
                unit="%" 
                color="emerald-500" 
                progress={insights.keyword_density || 0} 
                subtitle="Contextual Density"
            />
        </>
    );
}

export function SalaryInsight({ data }: { data?: any }) {
    if (!data) return null;
    const displayValue = data.range.split(' ')[0];
    const displayUnit = data.range.includes('LPA') ? 'LPA INR' : data.currency;

    return (
        <MetricCard 
            label="Compensation" 
            value={displayValue} 
            unit={displayUnit} 
            color="primary" 
            progress={75} 
            subtitle={data.location || "Market Analysis"}
        />
    );
}

export function CompanyIntelligence({ score, traits = [], content, companyName }: { score?: number, traits?: string[], content?: string, companyName?: string }) {
    const bullets = content ? content.split('\n').map(line => line.replace(/^•\s*/, '').trim()).filter(Boolean) : [];
    
    return (
        <DossierCard>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
                            <Brain className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Culture Alignment</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-6xl font-black text-white tracking-tighter">{score}</span>
                            <span className="text-sm font-black text-primary uppercase tracking-[0.4em]">Index</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {traits.map((t, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">{t}</span>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-[0.4em] text-white/80">Corporate Intelligence</h4>
                            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{companyName || 'Confidential'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {bullets.map((b, i) => (
                            <div key={i} className="flex gap-4 group/point">
                                <div className="mt-1.5 w-1 h-1 shrink-0 rounded-full bg-primary/40 group-hover/point:bg-primary transition-colors" />
                                <p className="text-[13px] text-white/40 leading-relaxed group-hover/point:text-white/70 transition-colors">{b}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DossierCard>
    );
}

export function SkillsView({ matched, missing }: { matched: string[], missing: string[] }) {
    return (
        <div className="space-y-12 py-4">
            {[
                { label: "Matched Expertise", items: matched, color: "emerald-500", icon: Shield, status: 'check' },
                { label: "Gaps to Bridge", items: missing, color: "primary", icon: Zap, status: 'cross' }
            ].map((sec, i) => (
                <div key={i} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div 
                            className="h-px w-6" 
                            style={{ backgroundColor: sec.color === 'primary' ? '#f2aa4c66' : '#10b98166' }} 
                        />
                        <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${sec.color === 'emerald-500' ? 'text-emerald-500' : 'text-primary'}`}>{sec.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {sec.items.map((skill, j) => (
                            <div key={j} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all">
                                {sec.status === 'check' ? (
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                                        <div className="w-px h-1.5 bg-primary rotate-45" />
                                        <div className="w-px h-1.5 bg-primary -rotate-45 absolute" />
                                    </div>
                                )}
                                <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">{skill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RedFlags({ flags }: { flags: string[] }) {
    if (flags.length === 0) return null;
    return (
        <div className="bg-red-500/[0.03] border border-red-500/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-1">
                    <span className="block text-sm font-black uppercase tracking-[0.4em] text-red-500">Critical Hiring Red Flags</span>
                    <p className="text-[10px] font-medium text-red-500/40 uppercase tracking-widest">Immediate points of concern for this role</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {flags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-red-500/[0.02] border border-white/5 group/flag">
                        <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <p className="text-[14px] text-white/50 italic leading-relaxed group-hover/flag:text-white/80 transition-colors">
                            {flag}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function InterviewQuestions({ questions, onCopy }: { questions: any[], onCopy: (text: string, label: string) => void }) {
    if (questions.length === 0) return null;
    return (
        <div className="space-y-8">
            <SectionHeader icon={Brain} title="Interview Simulation" subtitle="Targeted technical scenarios" />
            <div className="space-y-10">
                {questions.map((q, i) => (
                    <div key={i} className="group/q flex gap-6 items-start">
                        <div className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-primary/40 group-hover/q:bg-primary transition-colors" />
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start gap-8">
                                <p className="text-[14px] font-bold text-white/90 leading-relaxed tracking-tight italic">"{q.q}"</p>
                                <button 
                                    onClick={() => onCopy(q.q, "Question")} 
                                    className="p-2 rounded-xl bg-white/[0.02] hover:bg-primary/20 text-white/10 hover:text-primary border border-white/5 transition-all opacity-0 group-hover/q:opacity-100"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Hiring Intent:</span>
                                <span className="text-[11px] font-medium text-white/30 italic">{q.intent}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function OutreachEmail({ email, onCopy }: { email: string, onCopy: (text: string, label: string) => void }) {
    return (
        <DossierCard className="space-y-10">
            <div className="flex items-center justify-between">
                <SectionHeader icon={Zap} title="Strategic Outreach" subtitle="Optimized for conversion" />
                <button 
                    onClick={() => onCopy(email, "Email")} 
                    className="px-8 py-3 rounded-2xl bg-primary text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    <Copy className="w-3 h-3" />
                    Copy Brief
                </button>
            </div>
            <div className="relative pt-10 pb-8 px-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] shadow-inner overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
                <div className="relative z-10 whitespace-pre-wrap text-[14px] text-white/50 leading-relaxed font-serif italic selection:bg-primary selection:text-black">
                    {email}
                </div>
            </div>
        </DossierCard>
    );
}
