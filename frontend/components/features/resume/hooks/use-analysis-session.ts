"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAnalysis } from "@/components/providers/analysis-provider";

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

    if (id && id !== state.id && !company && !role && !jd) {
      setAnalysisData({ ...state, id });
    } else if (!id && state.id && !company && !role && !jd) {
      setAnalysisData({ ...state, id: null });
    }

    if (company || role || jd) {
      setAnalysisData({
        id: id || null,
        companyName: company || "",
        position: role || "",
        jd: jd || "",
        location: location || "",
        jobType: jobType || "",
      });

      const cleanUrl = id ? `${pathname}?id=${id}` : pathname;
      router.replace(cleanUrl, { scroll: false });
    }
  }, [searchParams, pathname, router, setAnalysisData, state.id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (
        event.data?.type === "FROM_EXTENSION" &&
        event.data?.action === "JOB_DATA_RESPONSE"
      ) {
        const data = event.data.data;
        if (data && data.description) {
          const update: Partial<typeof state> = {};
          if (data.company) update.companyName = data.company;
          if (data.role) update.position = data.role;
          if (data.location) update.location = data.location;
          if (data.jobType) update.jobType = data.jobType;
          update.jd = data.description;

          setAnalysisData(update);
          window.postMessage(
            { type: "FROM_WEB_APP", action: "ACK_JOB_DATA" },
            "*",
          );

          if (interval) clearInterval(interval);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    const requestData = () => {
      window.postMessage(
        { type: "FROM_WEB_APP", action: "REQUEST_JOB_DATA" },
        "*",
      );
    };
    requestData();
    interval = setInterval(requestData, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, [setAnalysisData]);

  return { session: state };
}
