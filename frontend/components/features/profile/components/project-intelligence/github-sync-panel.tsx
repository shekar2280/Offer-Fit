"use client";

import { RefreshCw } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
);

interface GithubSyncPanelProps {
    repoUrl: string;
    setRepoUrl: (val: string) => void;
    syncingRepo: string | null;
    onSync: () => void;
}

export function GithubSyncPanel({ repoUrl, setRepoUrl, syncingRepo, onSync }: GithubSyncPanelProps) {
    return (
        <div className="bg-zinc-950/40 border border-primary/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <GithubIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">Auto-Sync from GitHub</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-4">
                        Add a public repository of yours to gather information about your project contributions.
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="owner/repo"
                            className="flex-1 bg-zinc-900/50 border border-orange-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                        />
                        <button
                            onClick={onSync}
                            disabled={syncingRepo !== null || !repoUrl.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-50"
                        >
                            {syncingRepo === "global" ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                "Sync Repo"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
