"use client";

import { useEffect, useRef } from "react";

const DRAFT_KEYS = {
  analysis: "resume_ai_draft_analysis",
  customize: "resume_ai_draft_customize",
} as const;

interface DraftState {
  company: string;
  role: string;
  description: string;
  location: string;
  jobType: string;
  savedAt: number;
}

function readDraft(mode: "analysis" | "customize"): DraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEYS[mode]);
    if (!raw) return null;
    const draft: DraftState = JSON.parse(raw);
    if (Date.now() - draft.savedAt > 86_400_000) {
      localStorage.removeItem(DRAFT_KEYS[mode]);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function writeDraft(mode: "analysis" | "customize", state: Omit<DraftState, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEYS[mode],
      JSON.stringify({ ...state, savedAt: Date.now() })
    );
  } catch {
  }
}

export function clearDraft(mode: "analysis" | "customize") {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEYS[mode]);
}

interface UseDraftPersistenceOptions {
  mode: "analysis" | "customize";
  selectedId: string | null | undefined;
  company: string;
  role: string;
  description: string;
  location: string;
  jobType: string;
  onRestoreDraft: (draft: Omit<DraftState, "savedAt">) => void;
}

export function useDraftPersistence({
  mode,
  selectedId,
  company,
  role,
  description,
  location,
  jobType,
  onRestoreDraft,
}: UseDraftPersistenceOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    if (selectedId) return;

    const draft = readDraft(mode);
    if (draft && (draft.company || draft.role || draft.description)) {
      onRestoreDraft({
        company: draft.company,
        role: draft.role,
        description: draft.description,
        location: draft.location,
        jobType: draft.jobType,
      });
    }
  }, []);

  useEffect(() => {
    if (selectedId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeDraft(mode, { company, role, description, location, jobType });
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mode, selectedId, company, role, description, location, jobType]);
}
