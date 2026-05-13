import React from 'react';
import { Target, AlertCircle, Copy, Check, DollarSign, BookOpen, Brain, Briefcase, Zap, Shield, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export function CompanyIntelligence({ score, traits = [], content, companyName, intel }: { score?: number, traits?: string[], content?: string, companyName?: string, intel?: any }) {
    const bullets = content ? content.split('\n').map(line => line.replace(/^•\s*/, '').trim()).filter(Boolean) : [];
    const hasIntel = !!intel;

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

                    <div className="flex flex-wrap gap-2">
                        {hasIntel && intel.values_culture ? (
                            <span className="text-[12px] text-white/50 italic">{intel.values_culture}</span>
                        ) : traits.map((t, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">{t}</span>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center gap-6">
                        {intel?.logo_url && (
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                                <img 
                                    src={intel.logo_url} 
                                    alt={companyName} 
                                    className="w-full h-full object-contain"
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
                            {intel.tech_stack && (
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3">Tech Stack</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(intel.tech_stack).map(([cat, items]: [string, any]) => 
                                            Array.isArray(items) ? items.map((item, i) => (
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

export function StrategyCard({ strategy }: { strategy?: any }) {
    if (!strategy || !strategy.strategy_pillars) return null;
    
    return (
        <DossierCard>
            <SectionHeader icon={Briefcase} title="Customization Strategy" subtitle="How we tailored your resume" />
            <div className="space-y-6">
                {strategy.strategy_pillars.map((pillar: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start group/pillar">
                        <div className="mt-1.5 w-2 h-2 shrink-0 rounded-sm bg-primary/40 group-hover/pillar:bg-primary transition-colors" />
                        <div className="text-[14px] text-white/80 leading-relaxed font-medium">
                            <ReactMarkdown components={{ p: ({node, ...props}) => <span {...props} /> }}>
                                {pillar}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
            {strategy.key_keywords_to_inject && strategy.key_keywords_to_inject.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3">Injected Value Anchors</h5>
                    <div className="flex flex-wrap gap-2">
                        {strategy.key_keywords_to_inject.map((kw: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-bold text-primary/90">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </DossierCard>
    );
}

export function AuditBadge({ audit }: { audit?: any }) {
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
                        {audit.hallucinations_found.map((h: any, i: number) => (
                            <div key={i} className="p-3 bg-black/40 rounded-xl border border-red-500/30">
                                <p className="text-[11px] text-red-400 font-medium mb-1">Tailored: "{h.tailored}"</p>
                                <p className="text-[11px] text-white/40 italic">Reason: {h.reason}</p>
                            </div>
                        ))}
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
export function InterviewQuestions({ data, onCopy }: { data: any, onCopy: (text: string, label: string) => void }) {
    if (!data || !data.questions || data.questions.length === 0) return null;
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
                    {data.questions.map((q: any, i: number) => {
                        const questionText = typeof q === 'string' ? q : q.q;
                        const intentText = typeof q === 'object' ? q.intent : null;

                        return (
                            <div key={i} className="group/q flex gap-6 items-start">
                                <div className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-primary/40 group-hover/q:bg-primary transition-colors" />
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-start gap-8">
                                        <p className="text-[14px] font-bold text-white/90 leading-relaxed tracking-tight italic">"{questionText}"</p>
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


export function EmailDraftSection({ analysisId, verdict, initialEmail, onCopy }: { analysisId: string, verdict: string, initialEmail?: string, onCopy: (text: string, label: string) => void }) {
    const [email, setEmail] = React.useState(initialEmail || "");
    const [loading, setLoading] = React.useState(false);
    const [done, setDone] = React.useState(!!initialEmail);

    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
            setDone(true);
        }
    }, [initialEmail]);

    if (verdict === "REJECT") return null;

    const handleCopy = () => {
        const cleanEmail = email.replace(/\*\*(.*?)\*\*/g, '$1');
        navigator.clipboard.writeText(cleanEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generate = async () => {
        setLoading(true);
        setEmail("");
        setDone(false);
        try {
            const res = await fetch("/api/generate-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analysisId }),
            });

            if (!res.ok) {
                const errText = await res.text();
                setEmail(`Error: ${errText}`);
                setLoading(false);
                return;
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;
                const lines = decoder.decode(value).split("\n\n").filter(Boolean);
                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const parsed = JSON.parse(line.replace("data: ", ""));
                    if (parsed.done) { setDone(true); break; }
                    if (parsed.text) setEmail(prev => prev + parsed.text);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative overflow-hidden border border-primary/30 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 transition-none">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Zap className="w-3 h-3 text-primary animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Cold Outreach Draft</span>
                        </div>
                        <p className="text-[11px] text-white/30 font-medium italic tracking-wide">
                            AI-generated professional email to send directly to the hiring manager.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {done && (
                            <button
                                onClick={handleCopy}
                                className={`px-6 py-3 rounded-2xl border transition-all flex items-center gap-2 ${
                                    copied 
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        )}
                        {!done && (
                            <button
                                onClick={generate}
                                disabled={loading}
                                className="px-8 py-3 rounded-2xl bg-primary text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Drafting...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5" />
                                        Draft Email
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {(email || loading) && (
                    <div className="relative rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden mt-8">
                        <div className="relative p-10 min-h-[200px]">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
                            <div className="relative z-10 text-[15px] text-white/70 leading-relaxed font-serif selection:bg-primary/30 selection:text-white">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        strong: ({node, ...props}) => <strong className="font-black text-white tracking-wide" {...props} />,
                                        p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />
                                    }}
                                >
                                    {email}
                                </ReactMarkdown>
                                {loading && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-1 animate-pulse rounded-sm" />}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
