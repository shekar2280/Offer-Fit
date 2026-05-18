import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
    content: string;
    mode: "analysis" | "customize";
    isAnalyzing: boolean;
    onCopy: (text: string, label: string) => void;
}

export function MarkdownViewer({ content, mode, isAnalyzing, onCopy }: MarkdownViewerProps) {
    const customComponents: Components = {
        h2: ({ node, ...props }) => (
            <div className="mt-12 mb-8 flex items-center gap-4 border-b border-primary/20 pb-4 hover:bg-white/[0.03] hover:border-primary/40 transition-all px-4 -mx-4 rounded-t-2xl group/h2">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,0.5)] group-hover/h2:scale-y-125 transition-transform"></div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight m-0" {...props} />
            </div>
        ),
        h3: ({ node, ...props }) => (
            <div className="mt-8 mb-4 border-l-2 border-primary/50 pl-4 py-2 bg-gradient-to-r from-primary/[0.05] to-transparent rounded-r-xl hover:from-primary/[0.1] hover:border-primary/80 transition-all group/h3">
                <h3 className="text-lg font-bold text-white tracking-tight m-0 group-hover/h3:translate-x-1 transition-transform" {...props} />
            </div>
        ),
        h4: ({ node, ...props }) => (
            <div className="mt-6 mb-3 flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl group/h4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/h4:bg-primary group-hover/h4:scale-125 transition-all" />
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-white/70 group-hover/h4:text-white transition-colors m-0" {...props} />
            </div>
        ),
        ul: ({ node, ...props }) => <ul className="grid grid-cols-1 gap-3 my-4" {...props} />,
        li: ({ node, children, ...props }) => (
            <li className="bg-transparent hover:bg-white/[0.02] transition-colors rounded-xl p-3 flex flex-col gap-1" {...props}>
                <div className="flex items-start gap-3">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(242,170,76,0.5)]" />
                    <div className="text-white/80 leading-relaxed font-light text-[14.5px]">
                        {children}
                    </div>
                </div>
            </li>
        ),
        blockquote: ({ node, ...props }) => (
            <div className="my-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/[0.02] to-transparent border-l-2 border-primary/40 p-6 shadow-sm group/quote">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-primary group-hover/quote:w-1 transition-all" />
                <blockquote className="relative z-10 text-base font-serif italic text-primary/90 leading-relaxed m-0" {...props} />
            </div>
        ),
        strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
        p: ({ node, ...props }) => <p className="text-white/60 leading-[1.7] text-[15px] mb-4 font-light" {...props} />,
        code: ({ node, className, children, ...props }: any) => {
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
