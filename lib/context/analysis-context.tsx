"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AnalysisState, AnalysisContextType } from "@/lib/types";

const initialState: AnalysisState = {
  id: null,
  companyName: "",
  position: "",
  jd: "",
  location: "",
  jobType: "",
  isAnalyzing: false,
  analysisResult: undefined,
  customizationResult: undefined,
  insights: undefined,
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AnalysisState>(initialState);

  const setAnalysisData = useCallback((data: Partial<AnalysisState>) => {
    setState((prev) => ({ ...prev, ...data }));
  }, []);

  const resetSession = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <AnalysisContext.Provider value={{ state, setAnalysisData, resetSession }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
