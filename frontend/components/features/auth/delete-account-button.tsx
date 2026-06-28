"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { createClient } from "@/services/supabase/client";

export function DeleteAccountButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (feedback.trim() && user) {
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `[ACCOUNT DELETION] ${feedback}`,
            email: user.email,
            user_name: user.user_metadata?.full_name || "Unknown User"
          })
        });
      } catch (e) {
        // Ignore network errors on feedback, proceed to delete account
      }
    }
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      alert("Failed to delete account: " + error.message);
      setLoading(false);
      setIsOpen(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-xl text-xs font-semibold tracking-wide text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-all group relative"
      >
        <Trash2 className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 text-red-500" />
        <span>Delete Account</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-red-500/20 rounded-[2.5rem] p-8 max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white tracking-wide">
                Delete Account?
              </h3>

              <p className="text-xs text-white/50 leading-relaxed font-light">
                This action is permanent and cannot be undone. All your profile information, vector index chunks, personalized LaTeX resumes, and job analysis history will be deleted immediately.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mb-2">
                Why are you leaving? (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none resize-none min-h-[80px]"
                placeholder="Let us know how we can improve..."
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? "Deleting Account..." : "Yes, Delete Account"}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
