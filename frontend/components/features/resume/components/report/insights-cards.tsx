import React from 'react';
import { Copy, Check, Brain, Briefcase, Zap, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import remarkGfm from 'remark-gfm';
import { AnalysisResult, CompanyIntel, SalaryInsight as SalaryInsightType, StrategyData, AuditData, InterviewData, Hallucination } from '@/types';

const SectionHeader = ({ icon: Icon, title, subtitle, color = "primary" }: { icon: React.ElementType, title: string, subtitle?: string, color?: string }) => (
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
                    <span className={`font-black text-white leading-none tracking-tighter truncate ${isLongValue ? 'text-lg sm:text-xl' : 'text-3xl'
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

export function ScoreMetrics({ insights }: { insights: AnalysisResult }) {
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

export function SalaryInsight({ data }: { data?: SalaryInsightType & { location?: string } }) {
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

export function CompanyIntelligence({ score, traits = [], content, companyName, intel }: { score?: number, traits?: string[], content?: string, companyName?: string, intel?: CompanyIntel }) {
    const bullets = content ? content.split('\n').map(line => line.replace(/^•\s*/, '').trim()).filter(Boolean) : [];
    const hasIntel = !!intel;

    let parsedTraits = traits;
    if (traits && traits.length === 1 && typeof traits[0] === 'string' && traits[0].startsWith('[') && traits[0].endsWith(']')) {
        try {
            parsedTraits = JSON.parse(traits[0]);
        } catch (e) {
        }
    } else if (typeof traits === 'string') {
        try {
            parsedTraits = JSON.parse(traits);
        } catch (e) {
            parsedTraits = [traits];
        }
    }

    if (!Array.isArray(parsedTraits)) {
        parsedTraits = [];
    }

    let displayValuesCulture: string | string[] | null | undefined = intel?.values_culture;
    if (typeof displayValuesCulture === 'string' && displayValuesCulture.trim().startsWith('[') && displayValuesCulture.trim().endsWith(']')) {
        try {
            displayValuesCulture = JSON.parse(displayValuesCulture);
        } catch (e) {
        }
    }

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
                            <span className="text-6xl font-black text-white tracking-tighter">{score || '--'}</span>
                            <span className="text-sm font-black text-primary uppercase tracking-[0.4em]">Index</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        {Array.isArray(displayValuesCulture) ? (
                            displayValuesCulture.map((t, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                    <span className="text-[12px] font-medium text-white/60 leading-snug group-hover:text-white/90 transition-colors">{t}</span>
                                </div>
                            ))
                        ) : hasIntel && displayValuesCulture ? (
                            <span className="text-[12px] text-white/50 italic">{displayValuesCulture}</span>
                        ) : parsedTraits.map((t, i) => (
                            <div key={i} className="flex gap-3 items-start group">
                                <div className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                <span className="text-[12px] font-medium text-white/60 leading-snug group-hover:text-white/90 transition-colors">{t}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center gap-6">
                        {intel?.logo_url && (
                            <div className="relative w-12 h-12 rounded-2xl bg-white/10 border border-white/20 overflow-hidden shrink-0">
                                <Image
                                    src={intel.logo_url}
                                    alt={companyName || 'Company logo'}
                                    fill
                                    unoptimized
                                    className="object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-[0.4em] text-white/80">Corporate Intelligence</h4>
                            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{companyName || 'Confidential'} {intel?.is_startup ? '(Startup)' : ''}</p>
                        </div>
                    </div>

                    {hasIntel ? (
                        <div className="space-y-6">
                            {!!intel.tech_stack && Object.keys(intel.tech_stack || {}).length > 0 && (
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3">Tech Stack</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(intel.tech_stack || {}).map(([cat, items]: [string, unknown]) =>
                                            Array.isArray(items) ? (items as string[]).map((item: string, i: number) => (
                                                <span key={`${cat}-${i}`} className="px-3 py-1 bg-white/[0.05] border border-white/10 rounded-full text-[11px] font-medium text-white/80">
                                                    {item}
                                                </span>
                                            )) : null
                                        )}
                                    </div>
                                </div>
                            )}
                            {intel.engineering_blog_summary && (
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Engineering Focus</h5>
                                    <p className="text-[13px] text-white/60 leading-relaxed italic border-l-2 border-primary/30 pl-4">{intel.engineering_blog_summary}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {bullets.map((b, i) => (
                                <div key={i} className="flex gap-4 group/point">
                                    <div className="mt-1.5 w-1 h-1 shrink-0 rounded-full bg-primary/40 group-hover/point:bg-primary transition-colors" />
                                    <p className="text-[13px] text-white/40 leading-relaxed group-hover/point:text-white/70 transition-colors">{b}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DossierCard>
    );
}

export function StrategyCard({ strategy, verdict }: { strategy?: StrategyData, verdict?: string }) {
    if (!strategy || !strategy.execution_plan) return null;

    const filteredPillars = strategy.execution_plan.filter((pillar: string) => {
        if (verdict === "REJECT" && (pillar.toLowerCase().includes("call to action") || pillar.toLowerCase().includes("outreach email"))) {
            return false;
        }
        return true;
    });

    if (filteredPillars.length === 0) return null;

    return (
        <DossierCard>
            <SectionHeader icon={Briefcase} title="Customization Strategy" subtitle="How we tailored your resume" />
            <div className="space-y-6">
                {filteredPillars.map((pillar: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start group/pillar">
                        <div className="mt-1.5 w-2 h-2 shrink-0 rounded-sm bg-primary/40 group-hover/pillar:bg-primary transition-colors" />
                        <div className="text-[14px] text-white/80 leading-relaxed font-medium">
                            <ReactMarkdown components={{ 
                                p: ({ node: _node, ...props }) => <span {...props} /> 
                            }}>
                                {pillar}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
        </DossierCard>
    );
}

export function AuditBadge({ audit }: { audit?: AuditData }) {
    if (!audit) return null;

    const isClean = audit.verdict === "CLEAN" || audit.integrity_score === 100;

    return (
        <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-4 ${isClean ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <Shield className={`w-5 h-5 mt-1 shrink-0 ${isClean ? 'text-emerald-500' : 'text-red-500'}`} />
            <div>
                <h4 className={`text-xs font-black uppercase tracking-widest ${isClean ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isClean ? 'Integrity Verified' : 'Review Required'}
                </h4>
                <p className="text-[12px] text-white/60 mt-1 leading-relaxed">
                    {isClean ? 'All tailored facts match original resume. No hallucinations detected.' : 'Some facts could not be verified against the original resume.'}
                </p>

                {!isClean && audit.hallucinations_found && audit.hallucinations_found.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {audit.hallucinations_found.map((h: string | Hallucination, i: number) => {
                            const tailoredText = typeof h === 'string' ? h : h.tailored;
                            const reasonText = typeof h === 'string' ? 'Unverified information found' : h.reason;

                            return (
                                <div key={i} className="p-3 bg-black/40 rounded-xl border border-red-500/30">
                                    <p className="text-[11px] text-red-400 font-medium mb-1">Tailored: &quot;{tailoredText}&quot;</p>
                                    <p className="text-[11px] text-white/40 italic">Reason: {reasonText}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function SkillsView({ matched, missing }: { matched: string[], missing: string[] }) {
    const sections = [
        { label: "Matched Expertise", items: matched, color: "emerald-500", icon: Shield, status: 'check' },
        { label: "Gaps to Bridge", items: missing, color: "primary", icon: Zap, status: 'cross' }
    ].filter(sec => sec.items && sec.items.length > 0);

    if (sections.length === 0) return null;

    return (
        <div className="space-y-12 py-4">
            {sections.map((sec, i) => (
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
    if (!flags || flags.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-red-500/40" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 italic">Critical Red Flags</h3>
            </div>
            <div className="flex flex-wrap gap-3">
                {flags.map((flag, i) => (
                    <div
                        key={i}
                        className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-300"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] group-hover:scale-125 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-red-500/80 group-hover:text-red-500 transition-colors">
                            {flag}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
export function InterviewQuestions({ data, onCopy }: { data: InterviewData, onCopy: (text: string, label: string) => void }) {
    if (!data || !Array.isArray(data.questions) || data.questions.length === 0) return null;

    return (
        <div className="relative overflow-hidden bg-white/[0.02] border border-primary/30 rounded-[2.5rem] p-8 transition-none">
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <SectionHeader icon={Brain} title="Interview Simulation" subtitle="Targeted technical scenarios" />
                    {data.preparation_focus && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 max-w-md animate-in fade-in slide-in-from-right-4 duration-1000">
                            <Zap className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                                <span className="opacity-50 mr-2">Strategy:</span>
                                {data.preparation_focus}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-10">
                    {(Array.isArray(data.questions) ? data.questions : []).map((q: string | { q: string, intent: string }, i: number) => {
                        const questionText = typeof q === 'string' ? q : q.q;
                        const intentText = typeof q === 'object' && q !== null && 'intent' in q ? q.intent : null;

                        return (
                            <div key={i} className="group/q flex gap-6 items-start">
                                <div className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-primary/40 group-hover/q:bg-primary transition-colors" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start gap-8">
                                        <p className="text-[14px] font-bold text-white/90 leading-relaxed tracking-tight italic">&quot;{questionText}&quot;</p>
                                        <button
                                            onClick={() => onCopy(questionText, "Question")}
                                            className="p-2 rounded-xl bg-white/[0.02] hover:bg-primary/20 text-white/10 hover:text-primary border border-white/5 transition-all opacity-0 group-hover/q:opacity-100"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {intentText && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Hiring Intent:</span>
                                            <span className="text-[11px] font-medium text-white/30 italic">{intentText}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

