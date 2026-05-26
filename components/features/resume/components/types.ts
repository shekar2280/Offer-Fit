import { AnalysisResult } from "@/lib/types";

export interface AnalysisInsights extends AnalysisResult {
  tool_used?: string[];
}

export interface AnalysisReportProps {
  analysis: string;
  isAnalyzing: boolean;
  loadingStep: number;
  loadingMessages: string[];
  companyName: string;
  position: string;
  analysisId?: string;
  onReset: () => void;
  mode?: "analysis" | "customize";
  onSwitchMode: (newMode: "analysis" | "customize") => void;
  isHistoryMode?: boolean;
  hasCustomization?: boolean;
  insights?: AnalysisInsights | null;
  serverError?: string | null;
  isEditingForm?: boolean;
  onToggleForm?: () => void;
  userName?: string;
  hasLatexSource?: boolean;
}
