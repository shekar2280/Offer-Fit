import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useResumeProfile(user: any) {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [latexText, setLatexText] = useState("");
  const [hasExistingResume, setHasExistingResume] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const supabase = createClient();
      let { data: profile, error } = await supabase
        .from("profiles")
        .select("resume_text, latex_source")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile && !error) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({ id: user.id, email: user.email })
          .select()
          .single();
        
        if (!createError) profile = newProfile;
      }

      if (profile) {
        if (profile.resume_text) {
          setExtractedText(profile.resume_text);
          setHasExistingResume(true);
        }
        if (profile.latex_source) setLatexText(profile.latex_source);
      }
    };
    fetchProfile();
  }, [user]);

  return { extractedText, setExtractedText, latexText, setLatexText, hasExistingResume, setHasExistingResume };
}
