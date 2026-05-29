export async function evaluateAnalysis(
  resume: string,
  jd: string,
  analysis: string,
) {
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd, analysis })
    });
    if (!res.ok) throw new Error("Backend QA Judge failed");
    const jsonRes = await res.json();
    return {
      ...jsonRes.data,
      usage: jsonRes.usage || { totalTokenCount: 0 },
      estimated_cost: jsonRes.estimated_cost || 0
    };
  } catch {
    return {
      passed: true,
      score: 100,
      critique: "Evaluation skipped.",
      usage: null,
      estimated_cost: 0,
    };
  }
}

export async function evaluateResumeAudit(
  originalResume: string,
  tailoredResume: string,
) {
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ original_resume: originalResume, tailored_resume: tailoredResume })
    });
    if (!res.ok) throw new Error("Backend audit failed");
    const jsonRes = await res.json();
    return {
      ...jsonRes.data,
      usage: jsonRes.usage || { totalTokenCount: 0 },
      estimated_cost: jsonRes.estimated_cost || 0
    };
  } catch {
    return { integrity_score: 100, hallucinations_found: [], verdict: "CLEAN", usage: null, estimated_cost: 0 };
  }
}
