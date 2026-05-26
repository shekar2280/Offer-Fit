export const JUDGE_PROMPT = (
  resume: string,
  jd: string,
  analysis: string,
) => `
You are a Quality Assurance Judge for a FAANG Engineering Manager.
Evaluate the following analysis of a candidate's resume against a job description.

RESUME:
${resume}

JOB DESCRIPTION:
${jd}

ANALYSIS REPORT:
${analysis}

SCORING RULES:
1. **Instruction Compliance**: Did the agent skip ANY required sections (Strategic Alignment, Match Score Breakdown, Learning Roadmap)? If yes, score is 0.
2. **Brutal Honesty**: Is the agent being too nice? If they ignore a major YOE gap or missing core skill, score is < 50.
3. **Strategic Bridge**: Is the roadmap tailored correctly to their seniority tier (Entry/Mid/Senior)?

Output ONLY a JSON block:
{
  "passed": <boolean>,
  "score": <integer 0-100>,
  "critique": "<Specific reason for failure or praise>"
}
`;

export const AUDIT_PROMPT = (
  originalResume: string,
  tailoredResume: string,
) => `
You are an Integrity Auditor. Compare the original resume with the tailored version to detect hallucinations (fake skills, fake metrics, fake companies).

ORIGINAL RESUME:
${originalResume}

TAILORED RESUME:
${tailoredResume}

RULES:
1. Identifying adjacent skills is OKAY (Semantic Pivot).
2. Inventing a project that doesn't exist is a HALLUCINATION.
3. Inflating metrics (e.g., changing 10% to 50%) is a HALLUCINATION.

Output ONLY a JSON block:
{
  "integrity_score": <integer 0-100>,
  "hallucinations_found": [
    { "tailored": "<The specific fake text found in tailored version>", "reason": "<Why it is a hallucination>" }
  ],
  "verdict": "<CLEAN|CAUTION|REJECTED>"
}
`;
