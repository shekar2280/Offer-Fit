import { useState } from "react";
import { createClient } from "@/services/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

function isLatexSource(text: string): boolean {
  return text.includes("\\documentclass") || text.includes("\\begin{document}");
}

export function useResumeProfile(user: User | null) {
  const [resumeOverride, setResumeOverride] = useState<string | null>(null);
  const [hasExistingResumeOverride, setHasExistingResumeOverride] = useState<boolean | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const supabase = createClient();
      const response = await supabase
        .from("profiles")
        .select("resume_text, github_username")
        .eq("id", user.id)
        .maybeSingle();

      let data = response.data;
      const error = response.error;

      if (!data && !error) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ id: user.id, email: user.email })
          .select()
          .single();
        if (newProfile) data = newProfile;
      }
      return data;
    },
    enabled: !!user,
  });

  const resumeText = resumeOverride ?? profile?.resume_text ?? null;
  const hasExistingResume = hasExistingResumeOverride ?? !!(profile?.resume_text);

  const isLatex = isLatexSource(resumeText || "");

  return {
    extractedText: resumeText,
    setExtractedText: setResumeOverride,
    latexText: isLatex ? resumeText : null,
    setLatexText: setResumeOverride,
    hasExistingResume,
    setHasExistingResume: setHasExistingResumeOverride,
    masterLatex: isLatex ? resumeText : null,
    masterExtractedText: resumeText,
    isLatex,
    isLoadingProfile,
    hasGithubConnected: !!profile?.github_username,
  };
}
