import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Target, Award, Cloud, Database, Cpu, ShieldAlert, Layers, ArrowRight, Zap, GitBranch, LayoutGrid } from "lucide-react";

interface MarkdownViewerProps {
    content: string;
    mode: "analysis" | "customize";
    isAnalyzing: boolean;
    onCopy: (text: string, label: string) => void;
    verdict?: string;
}

interface ParsedSection {
    strategicAlignment: string;
    matchScoreBreakdown: { title: string; desc: string }[];
    learningRoadmap: { title: string; desc: string }[];
    strategicBridge: { title: string; desc: string } | null;
}

function sanitizeMd(text: string): string {
    return text
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
        .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
        .replace(/^>+\s*/gm, "")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function parseMarkdownReport(content: string): ParsedSection | null {
    if (!content) return null;

    const hasStrategic = /strategic\s+alignment/i.test(content);
    const hasMatchBreakdown = /match\s+score\s+breakdown/i.test(content);
    const hasRoadmap = /learning\s+roadmap/i.test(content);

    if (!hasStrategic && !hasMatchBreakdown && !hasRoadmap) {
        return null;
    }

    const result: ParsedSection = {
        strategicAlignment: "",
        matchScoreBreakdown: [],
        learningRoadmap: [],
        strategicBridge: null
    };

    const sections = content.split(/(?=####?\s+)/);

    for (const section of sections) {
        const trimmed = section.trim();
        if (!trimmed) continue;

        if (/strategic\s+alignment/i.test(trimmed)) {
            result.strategicAlignment = trimmed
                .replace(/^####?\s+strategic\s+alignment\s*/i, "")
                .trim();
        }
        else if (/match\s+score\s+breakdown/i.test(trimmed)) {
            const listContent = trimmed.replace(/^####?\s+match\s+score\s+breakdown\s*/i, "").trim();
            const items = listContent.split(/\n\s*[\*\-\+]\s*|\n\s*\d+\.\s*/);
            for (const item of items) {
                const cleanItem = item.trim();
                if (!cleanItem) continue;

                const boldMatch = cleanItem.match(/^\*\*(.*?)\*\*(?:\s*[:\-]\s*|\s+)([\s\S]*)/);
                if (boldMatch) {
                    result.matchScoreBreakdown.push({
                        title: boldMatch[1].trim(),
                        desc: boldMatch[2].trim()
                    });
                } else {
                    const colonMatch = cleanItem.match(/^([^\n]*?)(?:\s*[:\-]\s*)([\s\S]*)/);
                    if (colonMatch && colonMatch[1].length < 40) {
                        const cleanTitle = colonMatch[1].replace(/^[\d\.\s\*\-\+]+/, "").trim();
                        result.matchScoreBreakdown.push({
                            title: cleanTitle,
                            desc: colonMatch[2].trim()
                        });
                    } else {
                        const cleanDesc = cleanItem.replace(/^[\d\.\s\*\-\+]+/, "").trim();
                        result.matchScoreBreakdown.push({
                            title: "",
                            desc: cleanDesc
                        });
                    }
                }
            }
        }
        else if (/learning\s+roadmap/i.test(trimmed)) {
            const roadmapContent = trimmed.replace(/^####?\s+learning\s+roadmap\s*/i, "").trim();

            let stepsPart = roadmapContent;
            let bridgePart = "";

            const bridgeMatch = roadmapContent.match(/(?:^|\n)(#+\s*(?:\*\*)?strategic\s+bridge(?:\*\*)?[\s\S]*)/i);
            if (bridgeMatch) {
                const bridgeStart = roadmapContent.indexOf(bridgeMatch[1]);
                stepsPart = roadmapContent.substring(0, bridgeStart).trim();
                bridgePart = bridgeMatch[1].trim();
            }

            const stepItems = stepsPart.split(/\n\s*[\*\-\+]\s*|\n\s*\d+\.\s*/);
            for (const item of stepItems) {
                const cleanItem = item.trim();
                if (!cleanItem || cleanItem.toLowerCase().startsWith("identify the top") || cleanItem.toLowerCase().startsWith("here is") || cleanItem.toLowerCase().startsWith("the candidate")) {
                    continue;
                }

                if (/outreach\s+email|call\s+to\s+action/i.test(cleanItem) && cleanItem.length < 200 && !cleanItem.includes("**")) {
                    continue;
                }

                const boldMatch = cleanItem.match(/^\*\*(.*?)\*\*(?:\s*[:\-]\s*|\s+)([\s\S]*)/);
                if (boldMatch) {
                    result.learningRoadmap.push({
                        title: boldMatch[1].trim(),
                        desc: boldMatch[2].trim()
                    });
                } else {
                    const colonMatch = cleanItem.match(/^([^\n]*?)(?:\s*[:\-]\s*)([\s\S]*)/);
                    if (colonMatch && colonMatch[1].length < 60) {
                        const cleanTitle = colonMatch[1].replace(/^[\d\.\s\*\-\+]+/, "").trim();
                        result.learningRoadmap.push({
                            title: cleanTitle,
                            desc: colonMatch[2].trim()
                        });
                    } else {
                        const cleanDesc = cleanItem.replace(/^[\d\.\s\*\-\+]+/, "").trim();
                        result.learningRoadmap.push({
                            title: "Focus Area",
                            desc: cleanDesc
                        });
                    }
                }
            }

            if (bridgePart) {
                const bridgeBody = bridgePart.replace(/^#+\s*(?:\*\*)?strategic\s+bridge(?:\*\*)?\s*/i, "").trim();
                const match = bridgeBody.match(/^\*\*(.*?)\*\*(?:\s*[:\-]\s*|\s+)([\s\S]*)/);
                if (match) {
                    result.strategicBridge = {
                        title: match[1].trim(),
                        desc: match[2].trim()
                    };
                } else {
                    const tierMatch = bridgeBody.match(/^\*\*(Entry|Mid|Senior)(?:\s*[\(\d\-\w\)]*)*\*\*:\s*([\s\S]*)/i);
                    if (tierMatch) {
                        result.strategicBridge = {
                            title: `Strategic Bridge (${tierMatch[1]})`,
                            desc: tierMatch[2].trim()
                        };
                    } else {
                        result.strategicBridge = {
                            title: "Strategic Bridge",
                            desc: bridgeBody
                        };
                    }
                }
            }
        }
        else if (/strategic\s+bridge/i.test(trimmed)) {
            const bridgeBody = trimmed.replace(/^#+\s*(?:\*\*)?strategic\s+bridge(?:\*\*)?\s*/i, "").trim();
            const match = bridgeBody.match(/^\*\*(.*?)\*\*(?:\s*[:\-]\s*|\s+)([\s\S]*)/);
            if (match) {
                result.strategicBridge = {
                    title: match[1].trim(),
                    desc: match[2].trim()
                };
            } else {
                const tierMatch = bridgeBody.match(/^\*\*(Entry|Mid|Senior)(?:\s*[\(\d\-\w\)]*)*\*\*:\s*([\s\S]*)/i);
                if (tierMatch) {
                    result.strategicBridge = {
                        title: `Strategic Bridge (${tierMatch[1]})`,
                        desc: tierMatch[2].trim()
                    };
                } else {
                    result.strategicBridge = {
                        title: "Strategic Bridge",
                        desc: bridgeBody
                    };
                }
            }
        }
    }

    if (!result.strategicAlignment && result.matchScoreBreakdown.length === 0 && result.learningRoadmap.length === 0) {
        return null;
    }

    return result;
}

function getStepIcon(title: string) {
    const t = title.toLowerCase();
    if (t.includes("cloud") || t.includes("aws") || t.includes("azure") || t.includes("gcp") || t.includes("kubernetes") || t.includes("docker") || t.includes("infrastructure") || t.includes("iac") || t.includes("terraform")) {
        return Cloud;
    }
    if (t.includes("database") || t.includes("postgres") || t.includes("sql") || t.includes("nosql") || t.includes("redis") || t.includes("cache") || t.includes("mongodb")) {
        return Database;
    }
    if (t.includes("architecture") || t.includes("system design") || t.includes("scale") || t.includes("scaling") || t.includes("high availability") || t.includes("distributed") || t.includes("concurrency")) {
        return Cpu;
    }
    if (t.includes("testing") || t.includes("qa") || t.includes("observability") || t.includes("monitor") || t.includes("logging") || t.includes("tracing") || t.includes("dri") || t.includes("incident") || t.includes("reliability")) {
        return ShieldAlert;
    }
    if (t.includes("performance") || t.includes("optimization") || t.includes("tune") || t.includes("tuning") || t.includes("profiling")) {
        return Zap;
    }
    if (t.includes("agent") || t.includes("workflow") || t.includes("orchestrator") || t.includes("llm") || t.includes("langchain")) {
        return GitBranch;
    }
    if (t.includes("visualization") || t.includes("d3") || t.includes("chart") || t.includes("frontend") || t.includes("ux") || t.includes("ui")) {
        return LayoutGrid;
    }
    return Layers;
}

function parseRatingAndDesc(descText: string): { rating: string | null; cleanDesc: string } {
    const trimmed = descText.trim();
    const match = trimmed.match(/^(High|Moderate|Medium|Low)\b\s*[\.,\-]?\s*([\s\S]*)/i);
    if (match) {
        return {
            rating: match[1].trim(),
            cleanDesc: match[2].trim()
        };
    }
    return {
        rating: null,
        cleanDesc: trimmed
    };
}

export function MarkdownViewer({ content, mode, isAnalyzing, onCopy, verdict }: MarkdownViewerProps) {

    const parsed = mode === "analysis" ? parseMarkdownReport(content) : null;

    const customComponents: Components = {
        h2: ({ node: _node, ...props }) => (
            <div className="mt-12 mb-8 flex items-center gap-4 border-b border-primary/20 pb-4 hover:bg-white/[0.03] hover:border-primary/40 transition-all px-4 -mx-4 rounded-t-2xl group/h2">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,0.5)] group-hover/h2:scale-y-125 transition-transform"></div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight m-0" {...props} />
            </div>
        ),
        h3: ({ node: _node, ...props }) => (
            <div className="mt-8 mb-4 border-l-2 border-primary/50 pl-4 py-2 bg-gradient-to-r from-primary/[0.05] to-transparent rounded-r-xl hover:from-primary/[0.1] hover:border-primary/80 transition-all group/h3">
                <h3 className="text-lg font-bold text-white tracking-tight m-0 group-hover/h3:translate-x-1 transition-transform" {...props} />
            </div>
        ),
        h4: ({ node: _node, children, ...props }) => {
            const isStrategicBridge = String(children || "").toLowerCase().includes("strategic bridge");
            return (
                <div className={`mt-8 mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${isStrategicBridge
                    ? "bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(242,170,76,0.08)]"
                    : "bg-white/[0.02] border-white/5 group/h4"
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isStrategicBridge ? "bg-primary animate-pulse" : "bg-primary/40 group-hover/h4:bg-primary group-hover/h4:scale-125 transition-all"
                        }`} />
                    <h4 className={`text-[12px] font-black uppercase tracking-[0.25em] m-0 ${isStrategicBridge ? "text-primary" : "text-white/70 group-hover/h4:text-white"
                        }`} {...props}>{children}</h4>
                </div>
            );
        },
        ul: ({ node: _node, ...props }) => <ul className="grid grid-cols-1 gap-4 my-4" {...props} />,
        li: ({ node: _node, children, ...props }) => {
            let strongTitle = "";
            let remainingChildren = children;

            React.Children.forEach(children, (child) => {
                if (React.isValidElement(child) && child.type === "strong") {
                    const element = child as React.ReactElement<{ children?: React.ReactNode }>;
                    strongTitle = String(element.props.children || "");
                }
            });

            if (strongTitle) {
                const newChildren: React.ReactNode[] = [];
                React.Children.forEach(children, (child) => {
                    if (React.isValidElement(child) && child.type === "strong") {
                        return;
                    }
                    if (typeof child === "string") {
                        let text = child.trim();
                        if (text.startsWith(":") || text.startsWith(" -")) {
                            text = text.replace(/^[:\s\-]+/, "").trim();
                        }
                        if (text) newChildren.push(text);
                    } else {
                        newChildren.push(child);
                    }
                });
                remainingChildren = newChildren;
            }

            return (
                <li className="relative bg-white/[0.02] border border-white/5 hover:border-primary/25 hover:bg-white/[0.04] transition-all rounded-2xl p-5 flex flex-col gap-2 shadow-md group/li my-1.5 list-none text-left" {...props}>
                    <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-primary/25 group-hover/li:bg-primary/80 group-hover/li:scale-125 transition-all shadow-[0_0_8px_rgba(242,170,76,0.4)] shrink-0" />

                    <div className="flex flex-col gap-1">
                        {strongTitle ? (
                            <>
                                <span className="text-white font-bold text-[15px] tracking-tight">
                                    {strongTitle}
                                </span>
                                <div className="text-white/60 leading-relaxed font-light text-[13.5px]">
                                    {remainingChildren}
                                </div>
                            </>
                        ) : (
                            <div className="text-white/80 leading-relaxed font-light text-[14px]">
                                {children}
                            </div>
                        )}
                    </div>
                </li>
            );
        },
        blockquote: ({ node: _node, ...props }) => (
            <div className="my-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/[0.02] to-transparent border-l-2 border-primary/40 p-6 shadow-sm group/quote">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-primary group-hover/quote:w-1 transition-all" />
                <blockquote className="relative z-10 text-base font-serif italic text-primary/90 leading-relaxed m-0" {...props} />
            </div>
        ),
        strong: ({ node: _node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
        p: ({ node: _node, ...props }) => <p className="text-white/60 leading-[1.7] text-[15px] mb-4 font-light" {...props} />,
        code: ({ node: _node, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[12px] border border-primary/20" {...props}>
                    {children}
                </code>
            ) : (
                <div className="relative group/code my-6">
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                        {mode !== "customize" && (
                            <button
                                onClick={() => onCopy(String(children), "Code")}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/40 transition-all opacity-0 group-hover/code:opacity-100 backdrop-blur-xl"
                                title="Copy Code"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2">Copy</span>
                            </button>
                        )}
                    </div>
                    <pre className="bg-black/40 border border-white/5 hover:bg-white/[0.03] transition-all rounded-xl p-6 overflow-x-auto font-mono text-[13px] text-white/80 no-scrollbar">
                        <code {...props}>{children}</code>
                    </pre>
                </div>
            )
        }
    };

    if (parsed) {
        return (
            <div className="w-full space-y-10 py-4">

                {(parsed.strategicAlignment || parsed.matchScoreBreakdown.length > 0 || parsed.strategicBridge || parsed.learningRoadmap.length > 0) && (
                    <div className="rounded-[2rem] border border-zinc-800 bg-white/[0.01] overflow-hidden">

                        <div className="px-8 pt-6 pb-4 flex items-center gap-3">
                            <Target className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[12px] font-black uppercase tracking-[0.45em] text-primary">Candidate Overview</span>
                        </div>

                        {parsed.strategicAlignment && (
                            <div className="px-8 pt-5 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">Strategic Alignment</h3>
                                </div>
                                <p className="text-[14.5px] text-white/80 leading-[1.85] font-light tracking-[-0.01em]">
                                    {sanitizeMd(parsed.strategicAlignment)}
                                </p>
                            </div>
                        )}

                        {parsed.matchScoreBreakdown.length > 0 && (
                            <div className="px-8 pt-6 pb-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">Match Score Breakdown</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {parsed.matchScoreBreakdown.map((item, idx) => {
                                        const { rating, cleanDesc } = parseRatingAndDesc(item.desc);
                                        return (
                                            <div key={idx} className="bg-white/[0.02] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 space-y-3 transition-colors duration-200 flex flex-col">
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <h4 className="text-[14px] font-bold text-white/90 leading-snug tracking-tight min-w-0 flex-1">{sanitizeMd(item.title) || `Evaluation Dimension`}</h4>
                                                    {rating && (
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${rating.toLowerCase() === "high"
                                                            ? "bg-emerald-500/10 text-emerald-400/80"
                                                            : rating.toLowerCase() === "low"
                                                                ? "bg-red-500/10 text-red-400/80"
                                                                : "bg-amber-500/10 text-amber-400/80"
                                                            }`}>
                                                            {rating}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[13px] text-white/45 leading-relaxed font-light flex-1">{sanitizeMd(cleanDesc)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {parsed.strategicBridge && (
                            <div className="px-8 pt-6 pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">{sanitizeMd(parsed.strategicBridge.title)}</h3>
                                </div>
                                <p className="text-[14.5px] text-white/80 leading-[1.85] font-light tracking-[-0.01em]">
                                    {sanitizeMd(parsed.strategicBridge.desc)}
                                </p>
                            </div>
                        )}

                        {parsed.learningRoadmap.length > 0 && (
                            <div className="px-8 pt-6 pb-8">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Actionable Upskilling Milestones</span>
                                </div>
                                <div className="space-y-3">
                                    {parsed.learningRoadmap.map((step, idx) => {
                                        const IconComp = getStepIcon(step.title);
                                        return (
                                            <div key={idx} className="flex items-start gap-4 group/milestone">

                                                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-white/40 text-[10px] font-black mt-3.5 group-hover/milestone:border-primary/60 group-hover/milestone:text-primary transition-all">
                                                    {idx + 1}
                                                </div>

                                                <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 transition-colors">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <IconComp className="w-4 h-4 text-primary/70 shrink-0 group-hover/milestone:text-primary transition-colors" />
                                                            <h4 className="text-[14px] font-bold text-white/90 leading-snug tracking-tight">
                                                                {sanitizeMd(step.title) || `Focus Area`}
                                                            </h4>
                                                        </div>
                                                        <div className="flex-shrink-0 flex flex-col items-end gap-1.5 min-w-[70px]">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Priority</span>
                                                            <div className="w-16 h-[3px] bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{ width: `${100 - idx * 25}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-[12.5px] text-white/50 leading-relaxed font-light">
                                                        {sanitizeMd(step.desc)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>
        );
    }

    return (
        <div className="relative markdown-body">
            <style>{`
                .markdown-body h3 + ul > li {
                    border-left: 2px solid rgba(242, 170, 76, 0.4) !important;
                    border-top-left-radius: 0.125rem !important;
                    border-bottom-left-radius: 0.125rem !important;
                }
                .markdown-body h3 + ul > li:hover {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                }
            `}</style>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                {mode === "customize" ? `\`\`\`latex\n${content}\n\`\`\`` : content}
            </ReactMarkdown>
            {isAnalyzing && (
                <span className="inline-block w-[2px] h-[1em] bg-primary ml-1 animate-[pulse_1s_infinite] align-middle" />
            )}
        </div>
    );
}
