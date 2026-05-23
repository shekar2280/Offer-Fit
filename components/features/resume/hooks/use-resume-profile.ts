import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { User } from "@supabase/supabase-js";

export function useResumeProfile(user: User | null) {
  const [latexOverride, setLatexOverride] = useState<string | null>(null);
  const [extractedOverride, setExtractedOverride] = useState<string | null>(null);
  const [hasExistingResumeOverride, setHasExistingResumeOverride] = useState<boolean | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const supabase = createClient();
      const response = await supabase
        .from("profiles")
        .select("resume_text, latex_source")
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

  const latexText = latexOverride ?? profile?.latex_source ?? "";
  const extractedText = extractedOverride ?? profile?.resume_text ?? null;
  const hasExistingResume = hasExistingResumeOverride ?? !!(profile?.resume_text);

  const masterLatex = profile?.latex_source ?? "";
  const masterExtractedText = profile?.resume_text ?? null;

  return {
    extractedText,
    setExtractedText: setExtractedOverride,
    latexText,
    setLatexText: setLatexOverride,
    hasExistingResume,
    setHasExistingResume: setHasExistingResumeOverride,
    masterLatex,
    masterExtractedText,
    isLoadingProfile,
  };
}
