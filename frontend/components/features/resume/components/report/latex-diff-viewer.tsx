"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { DiffLine, Hunk, LatexDiffViewerProps } from "@/types";

function computeDiff(original: string, updated: string): Hunk[] {
  const oldLines = original.split("\n");
  const newLines = updated.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const rawDiff: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.unshift({ type: "unchanged", content: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({ type: "added", content: newLines[j - 1] });
      j--;
    } else {
      rawDiff.unshift({ type: "removed", content: oldLines[i - 1] });
      i--;
    }
  }

  let oldLineNo = 1;
  let newLineNo = 1;
  for (const line of rawDiff) {
    if (line.type === "unchanged") {
      line.oldLineNo = oldLineNo++;
      line.newLineNo = newLineNo++;
    } else if (line.type === "removed") {
      line.oldLineNo = oldLineNo++;
    } else {
      line.newLineNo = newLineNo++;
    }
  }

  const CONTEXT = 3;
  const changedIndices = new Set<number>();
  rawDiff.forEach((line, idx) => {
    if (line.type !== "unchanged") {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(rawDiff.length - 1, idx + CONTEXT); k++) {
        changedIndices.add(k);
      }
    }
  });

  const hunks: Hunk[] = [];
  let currentHunk: DiffLine[] | null = null;
  let hunkOldStart = 1;
  let hunkNewStart = 1;

  rawDiff.forEach((line, idx) => {
    if (changedIndices.has(idx)) {
      if (!currentHunk) {
        currentHunk = [];
        hunkOldStart = line.oldLineNo ?? newLineNo;
        hunkNewStart = line.newLineNo ?? oldLineNo;
      }
      currentHunk.push(line);
    } else {
      if (currentHunk) {
        hunks.push({ lines: currentHunk, oldStart: hunkOldStart, newStart: hunkNewStart });
        currentHunk = null;
      }
    }
  });

  if (currentHunk) {
    hunks.push({ lines: currentHunk, oldStart: hunkOldStart, newStart: hunkNewStart });
  }

  return hunks;
}

export function LatexDiffViewer({ original, updated, onCopyUpdated }: LatexDiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(new Set());

  const hunks = useMemo(() => computeDiff(original, updated), [original, updated]);

  const totalAdded = useMemo(() =>
    hunks.flatMap(h => h.lines).filter(l => l.type === "added").length, [hunks]);
  const totalRemoved = useMemo(() =>
    hunks.flatMap(h => h.lines).filter(l => l.type === "removed").length, [hunks]);

  const handleCopy = () => {
    onCopyUpdated();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleHunk = (idx: number) => {
    setCollapsedHunks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0d1117] relative">
      <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            resume.tex
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
              <span className="text-emerald-400">+{totalAdded}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-red-400">
              <span className="text-red-400">−{totalRemoved}</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${copied
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
            : "bg-primary text-black hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      <div className="overflow-x-auto">
        {hunks.length === 0 ? (
          <div className="px-8 py-12 text-center text-white/20 text-[12px] font-mono">
            No changes detected between original and customized resume.
          </div>
        ) : (
          hunks.map((hunk, hunkIdx) => (
            <div key={hunkIdx}>
              <button
                onClick={() => toggleHunk(hunkIdx)}
                className="w-full flex items-center gap-3 px-4 py-1.5 bg-[#1a2030] border-y border-blue-500/20 hover:bg-[#1e2740] transition-colors group"
              >
                <span className="text-blue-400/70 font-mono text-[11px]">
                  @@ -{hunk.oldStart} +{hunk.newStart} @@
                </span>
                {hunkIdx > 0 && (
                  <span className="text-[9px] text-white/20 ml-auto group-hover:text-white/40 transition-colors flex items-center gap-1">
                    {collapsedHunks.has(hunkIdx) ? (
                      <><ChevronDown className="w-3 h-3" /> Expand</>
                    ) : (
                      <><ChevronUp className="w-3 h-3" /> Collapse</>
                    )}
                  </span>
                )}
              </button>

              {!collapsedHunks.has(hunkIdx) && (
                <table className="w-full border-collapse text-[12px] font-mono">
                  <tbody>
                    {hunk.lines.map((line, lineIdx) => {
                      const isAdded = line.type === "added";
                      const isRemoved = line.type === "removed";

                      return (
                        <tr
                          key={lineIdx}
                          className={`group/row leading-5 ${isAdded
                            ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]"
                            : isRemoved
                              ? "bg-red-500/[0.08] hover:bg-red-500/[0.14]"
                              : "hover:bg-white/[0.02]"
                            } transition-colors`}
                        >
                          <td className={`select-none w-[52px] text-right pr-3 py-0.5 border-r ${isAdded
                            ? "border-emerald-500/10 text-transparent"
                            : isRemoved
                              ? "border-red-500/10 text-red-400/40"
                              : "border-white/5 text-white/20"
                            } text-[10px]`}>
                            {line.oldLineNo ?? ""}
                          </td>
                          <td className={`select-none w-[52px] text-right pr-3 py-0.5 border-r ${isRemoved
                            ? "border-red-500/10 text-transparent"
                            : isAdded
                              ? "border-emerald-500/10 text-emerald-400/40"
                              : "border-white/5 text-white/20"
                            } text-[10px]`}>
                            {line.newLineNo ?? ""}
                          </td>
                          <td className={`select-none w-[24px] text-center py-0.5 font-bold ${isAdded ? "text-emerald-400" : isRemoved ? "text-red-400" : "text-white/10"
                            }`}>
                            {isAdded ? "+" : isRemoved ? "−" : " "}
                          </td>
                          <td className={`py-0.5 pr-4 pl-1 whitespace-pre ${isAdded
                            ? "text-emerald-300"
                            : isRemoved
                              ? "text-red-300/80"
                              : "text-white/60"
                            }`}>
                            {line.content}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-2.5 bg-[#161b22] border-t border-white/10 flex items-center justify-between">
        <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
          {hunks.length} hunk{hunks.length !== 1 ? "s" : ""} changed
        </span>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-emerald-400/60">+{totalAdded} additions</span>
          <span className="text-red-400/60">−{totalRemoved} deletions</span>
        </div>
      </div>
    </div>
  );
}
