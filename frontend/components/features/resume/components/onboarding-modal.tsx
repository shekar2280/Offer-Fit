"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, Code2, Upload, ClipboardPaste, ArrowRight, Check, Info, FileCode2 } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { toast } from "sonner";

interface OnboardingModalProps {
  userId: string;
  onComplete: (resumeText: string) => void;
}

function isLatexSource(text: string): boolean {
  return text.includes("\\documentclass") || text.includes("\\begin{document}");
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [tab, setTab] = useState<"pdf" | "latex">("latex");
  const [latexText, setLatexText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [savedText, setSavedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }
  }, [latexText]);

  const saveAndComplete = async (text: string) => {
    const supabase = createClient();
    await supabase.from("profiles").upsert({ id: userId, resume_text: text });
    await fetch("/api/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    onComplete(text);
  };

  const handleSaveLatex = async () => {
    if (!latexText.trim()) return;
    setIsUploading(true);
    try {
      await saveAndComplete(latexText.trim());
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.text) throw new Error("No text extracted");
      setSavedText(data.text);
      await saveAndComplete(data.text);
    } catch {
      toast.error("Upload failed. Check the file and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isLatex = isLatexSource(latexText);
  const charCount = latexText.length;

  if (savedText) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
        <div className="relative w-full max-w-md bg-[#030303] border border-emerald-500/20 rounded-[2rem] p-10 text-center shadow-[0_0_80px_rgba(52,211,153,0.1)] animate-in zoom-in-95 duration-500 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Resume Uploaded!</h2>
          <p className="text-white/50 text-sm">Saving...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#030303]/90 backdrop-blur-md border border-primary/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700 flex flex-col">

        <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center relative z-10">
          <h2 className="font-heading text-3xl font-black text-white tracking-tight mb-3">
            Setup Your Workspace
          </h2>
          <p className="text-white/40 text-sm max-w-md leading-relaxed">
            Upload your existing resume to unlock AI-powered insights, tailoring, and ATS optimization.
          </p>
        </div>

        <div className="flex justify-center mb-8 relative z-10">
          <div className="flex p-1 bg-white/[0.03] border border-white/[0.05] rounded-full backdrop-blur-sm">
            <button
              onClick={() => setTab("latex")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${tab === "latex"
                  ? "bg-primary text-black"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              <Code2 className="w-4 h-4" />
              LaTeX Source
            </button>
            <button
              onClick={() => setTab("pdf")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${tab === "pdf"
                  ? "bg-primary text-black"
                  : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              <Upload className="w-4 h-4" />
              PDF / DOCX
            </button>
          </div>
        </div>

        <div className="px-8 pb-10 relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {tab === "latex" ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[320px] flex flex-col justify-between">
              <div className="rounded-3xl border border-white/10 bg-black/50 overflow-hidden flex flex-col ring-1 ring-white/5 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all shadow-inner flex-1">
                <div className="px-5 py-3 border-b border-white/5 flex items-center bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Editor</span>
                  </div>
                </div>

                <div className="relative flex-1 flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={latexText}
                    onChange={e => setLatexText(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full flex-1 bg-transparent text-[13px] font-mono text-white/80 leading-relaxed resize-none outline-none px-6 py-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[140px]"
                    placeholder="Paste your \documentclass... here"
                  />
                </div>

                <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    {isLatex ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Valid LaTeX
                      </span>
                    ) : latexText ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        Plain Text (Analysis Only)
                      </span>
                    ) : null}
                  </div>
                  {charCount > 0 && (
                    <span className="text-[10px] text-white/20 font-mono font-medium">{charCount.toLocaleString()} chars</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveLatex}
                disabled={!latexText.trim() || isUploading}
                className="mt-6 w-full py-4 rounded-2xl font-heading font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-black shrink-0 flex items-center justify-center gap-2"
              >
                {isUploading ? "Saving..." : (
                  <>
                    Save & Continue Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[320px] flex flex-col justify-center">
              <div
                className={`relative w-full max-w-md mx-auto rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center py-10 h-full min-h-[320px] ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.01] shadow-[0_0_40px_rgba(242,170,76,0.1)]"
                    : "border-white/10 bg-white/[0.01] hover:border-primary/30 hover:bg-primary/[0.02]"
                  }`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.tex"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Loading file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 text-center px-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${isDragging ? "bg-primary text-black rotate-6" : "bg-white/[0.03] border border-white/10 text-white/40"}`}>
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">
                        {isDragging ? "Drop document here" : "Click to browse or drag file"}
                      </h3>
                      <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                        We accept PDF and Word documents. Note that LaTeX source code is required for automated formatting.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
