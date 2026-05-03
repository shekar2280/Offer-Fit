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
            <div className="mt-8 mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,0.5)]"></div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight m-0" {...props} />
            </div>
        ),
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white/90 mt-8 mb-3 tracking-tight" {...props} />,
        ul: ({ node, ...props }) => <ul className="grid grid-cols-1 gap-3 my-4" {...props} />,
        li: ({ node, children, ...props }) => (
            <li className="bg-white/[0.01] border border-white/5 rounded-xl p-4 shadow-sm backdrop-blur-sm hover:border-primary/20 transition-all flex flex-col gap-1 group/item" {...props}>
                <div className="flex items-start gap-3">
                    <div className="mt-2 w-1 h-1 rounded-full bg-primary/40 group-hover/item:bg-primary transition-all shrink-0" />
                    <div className="text-white/60 leading-relaxed font-light text-[14px]">
                        {children}
                    </div>
                </div>
            </li>
        ),
        blockquote: ({ node, ...props }) => (
            <div className="my-8 relative overflow-hidden rounded-2xl bg-primary/[0.02] border border-white/10 p-6 shadow-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <blockquote className="relative z-10 text-base font-serif italic text-primary/90 leading-relaxed m-0" {...props} />
            </div>
        ),
        strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
        p: ({ node, ...props }) => <p className="text-white/40 leading-[1.7] text-[15px] mb-4 font-light" {...props} />,
        code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[12px] border border-primary/10" {...props}>
                    {children}
                </code>
            ) : (
                <div className="relative group/code my-6">
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                         {mode !== "customize" && (
                             <button 
                                onClick={() => onCopy(String(children), "Code")}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/code:opacity-100 backdrop-blur-xl"
                                title="Copy Code"
                             >
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2">Copy</span>
                             </button>
                         )}
                    </div>
                    <pre className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto font-mono text-[13px] text-white/70 no-scrollbar">
                        <code {...props}>{children}</code>
                    </pre>
                </div>
            )
        }
    };

    return (
        <div className="relative">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                {mode === "customize" ? `\`\`\`latex\n${content}\n\`\`\`` : content}
            </ReactMarkdown>
            {isAnalyzing && (
                <span className="inline-block w-[2px] h-[1em] bg-primary ml-1 animate-[pulse_1s_infinite] align-middle" />
            )}
        </div>
    );
}
