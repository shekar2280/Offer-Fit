export async function runStrategyAgent(
  companyName: string,
  position: string,
  resumeText: string,
  jd: string
) {
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${backendUrl}/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: companyName,
      position,
      resume_text: resumeText,
      jd
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to run strategy agent in Python backend: ${res.statusText}`);
  }

  return await res.json();
}
