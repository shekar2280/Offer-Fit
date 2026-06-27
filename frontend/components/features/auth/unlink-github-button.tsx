"use client";

import { useState } from "react";
import { Github, Unplug } from "lucide-react";
import { createClient } from "@/services/supabase/client";

export function UnlinkGithubButton() {
  const [loading, setLoading] = useState(false);

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink your GitHub account? You will no longer be able to log in using GitHub.")) return;

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');

    if (!githubIdentity) {
      alert("No GitHub account is currently linked.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.unlinkIdentity(githubIdentity);

    setLoading(false);

    if (error) {
      alert("Failed to unlink GitHub: " + error.message);
    } else {
      alert("GitHub account successfully unlinked.");
    }
  };

  return (
    <button
      onClick={handleUnlink}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white/50 bg-white/[0.02] hover:bg-red-500/10 border border-transparent hover:border-red-500/30 hover:text-red-400 transition-all group disabled:opacity-50"
    >
      <Unplug className="w-3.5 h-3.5" />
      <span>{loading ? "Unlinking..." : "Disconnect"}</span>
    </button>
  );
}
