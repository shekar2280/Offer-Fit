"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAnalysis } from "@/lib/context/analysis-context";

export function useAnalysisSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state, setAnalysisData } = useAnalysis();

  useEffect(() => {
    const id = searchParams.get("id");
    const company = searchParams.get("company");
    const role = searchParams.get("role");
    const jd = searchParams.get("jd");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");

    if (company || role || jd) {
      setAnalysisData({
        id: id || state.id,
        companyName: company || "",
        position: role || "",
        jd: jd || "",
        location: location || "",
        jobType: jobType || "",
      });

      const cleanUrl = id ? `${pathname}?id=${id}` : pathname;
      router.replace(cleanUrl);
    }
  }, [searchParams, pathname, router, setAnalysisData, state.id]);

  return { session: state };
}
