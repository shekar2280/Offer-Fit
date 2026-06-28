"use client";

import { useState } from "react";
import { Unplug, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { createClient } from "@/services/supabase/client";

export function UnlinkGithubButton() {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "success" | "error" | "info";
    onConfirm?: () => void;
  } | null>(null);

  const startUnlink = () => {
    setModal({
      isOpen: true,
      title: "Disconnect GitHub?",
      message: "Are you sure you want to disconnect your GitHub account? OfferFit will no longer be able to auto-sync your project repositories.",
      type: "confirm",
      onConfirm: executeUnlink
    });
  };

  const executeUnlink = async () => {
    setModal(null);
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');

    if (!githubIdentity) {
      setModal({
        isOpen: true,
        title: "Not Connected",
        message: "No GitHub account is currently linked.",
        type: "info"
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.unlinkIdentity(githubIdentity);
    setLoading(false);

    if (error) {
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to unlink GitHub: " + error.message,
        type: "error"
      });
    } else {
      setModal({
        isOpen: true,
        title: "Disconnected",
        message: "GitHub account successfully unlinked.",
        type: "success",
        onConfirm: () => {
          window.location.reload();
        }
      });
    }
  };

  return (
    <>
      <button
        onClick={startUnlink}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white/50 bg-white/[0.02] hover:bg-red-500/10 border border-transparent hover:border-red-500/30 hover:text-red-400 transition-all group disabled:opacity-50"
      >
        <Unplug className="w-3.5 h-3.5" />
        <span>{loading ? "Unlinking..." : "Disconnect"}</span>
      </button>

      {modal && modal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-start justify-center p-4 pt-[15vh]">
          <div className="bg-zinc-950 border border-primary/20 rounded-[2rem] p-6 max-w-sm w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(242,170,76,0.1)]">
                {modal.type === "confirm" ? (
                  <Unplug className="w-5 h-5" />
                ) : modal.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <h3 className="text-sm font-bold text-white tracking-wide">
                {modal.title}
              </h3>

              <div className="space-y-2">
                <p className="text-xs text-white/50 leading-relaxed font-light">
                  {modal.message}
                </p>
                {modal.type === "confirm" && (
                  <p className="text-[10px] text-white/30 italic">
                    Note: To fully revoke access, you must also remove this application from your GitHub account settings.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2.5">
              {modal.type === "confirm" ? (
                <>
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setModal(null);
                    if (modal.onConfirm) modal.onConfirm();
                  }}
                  className="w-full py-2.5 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Okay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
