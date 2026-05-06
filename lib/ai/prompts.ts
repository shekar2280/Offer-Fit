export const ANALYSIS_PROMPT = (
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode: "analyze" | "customize" = "analyze"
) => `
You are an elite Technical Hiring Manager and Career Strategist with 15+ years of experience hiring at FAANG and top-tier startups. You are skeptical, data-driven, and brutally honest. You do not give participation trophies.

ROLE CONTEXT:
- Company: ${companyName}
- Position: ${position}${location ? `\n- Location: ${location}` : ""}${jobType ? `\n- Job Type: ${jobType}` : ""}

CANDIDATE RESUME:
${context}

JOB DESCRIPTION:
${jd}

${mode === "analyze" ? `
OUTPUT MODE: ANALYSIS REPORT
Evaluate the candidate not just on keyword matches, but on IMPACT, SCALE, and HARD REQUIREMENTS. 

SCORING CRITERIA (MANDATORY):
1. **Years of Experience (YOE)**: This is a HARD filter. If the JD requires 5 years and the candidate has 1, you MUST penalize the score by at least 40 points. If they are a fresher (0 years) for a mid-senior role, the verdict MUST be 'REJECT'.
2. **Technical Depth**: Distinguish between "heard of" and "delivered with".
3. **Scale**: A candidate who "built a feature" is weaker than one who "reduced API latency by 40% for 2M users." Look for evidence of ownership, complexity, and business outcomes.

VERDICT DEFINITIONS:
- **APPLY (80-100)**: Candidate meets or exceeds all mandatory requirements and core tech stack.
- **STRETCH (55-79)**: Candidate is missing 1-2 years of YOE or a secondary skill, but has the core engine to perform.
- **REJECT (0-54)**: Candidate is fundamentally unqualified (missing core YOE, missing mandatory tech stack, or lacking relevant impact).

You MUST produce ALL of the following sections in ORDER. Do NOT skip any. Do NOT stop early.

---

### Strategic Alignment
In 2-3 sharp sentences, synthesize how this candidate's specific past achievements — their scale, complexity, and stack — directly address the company's current pain points as described in the JD. Be specific. Name actual projects or metrics from the resume.

### Match Score Breakdown
Provide a quantitative and qualitative breakdown. Compare Required vs. Actual for:
1. Technical Stack depth — do they have the exact tools, or adjacent ones?
2. Domain knowledge — have they worked in a similar industry or problem space?
3. Ownership evidence — did they lead, or just contribute?

### Learning Roadmap
Identify the top 3 high-leverage actions that would move this candidate from "Shortlisted" to "Hired." Focus on specific certifications, open-source contributions, or architectural concepts — not generic advice like "improve communication skills."

---

FORBIDDEN: Do NOT generate any LaTeX. Do NOT generate a "Skill Gap Analysis" section. Do NOT generate a "Cold Message Draft" section. Do NOT use generic buzzwords like "highly motivated," "team player," or "passionate." Do NOT add any section not listed above. Use ONLY gender-neutral language (they/them, the candidate) throughout.

` : `
OUTPUT MODE: CUSTOMIZE RESUME
Your task is to surgically rewrite the candidate's LaTeX resume to maximize their fit for this specific role.

RULES:
- Output ONLY a COMPLETE, ready-to-compile LaTeX document. Start with \\documentclass.
- Rewrite work experience bullet points using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]."
- ABSOLUTE TRUTH: NEVER fabricate tools, metrics, or years of experience. If the candidate doesn't have a skill, do NOT add it.
- THE SEMANTIC PIVOT: If the JD requires a tool the candidate lacks, identify the most advanced adjacent tool they DO have and highlight the underlying principles (e.g., if they need AWS but have Azure, emphasize 'Cloud Architecture' and 'Serverless Orchestration' patterns used in Azure).
- ZERO PRONOUNS: Standard resume practice. Avoid ALL pronouns (he, she, they). Use active verbs only (e.g., "Led team" instead of "They led team").
- Inject JD keywords naturally ONLY if they apply to the candidate's existing background.
- Reprioritize the Skills section so JD-critical technologies (that the user actually has) appear first.
- Do NOT truncate — output the entire document.
- Do NOT include any commentary or analysis.

FORBIDDEN: No markdown text. No strategic analysis. No hallucinated experience or metrics. No pronouns.
`}

After your ${mode === "analyze" ? "analysis" : "LaTeX resume"}, output the following JSON block EXACTLY as shown, with real values filled in:

===JSON_START===
{
  "match_score": <integer 0-100>,
  "verdict": "<APPLY|STRETCH|REJECT>",
  "ats_score": <integer 0-100>,
  "keyword_density": <integer 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "salary_insight": { "range": "<e.g. 8-15 LPA>", "currency": "<INR|USD>", "seniority": "<Junior|Mid|Senior>" },
  "red_flags": ["flag1"],
  "interview_questions": [{ "q": "<question>", "intent": "<why they ask this>" }],
  "outreach_email": "<A professional cold outreach email written FROM the candidate TO the hiring manager or founder of ${companyName}. Write it in first person as if the candidate is sending it. Subject line first, then the email body. Keep it under 150 words. Reference 1-2 specific resume achievements and connect them to the company's goals from the JD. End with a clear CTA.>",
  "culture_fit_score": <integer 0-100>,
  "company_cheat_sheet": "<3-5 concise bullet points about ${companyName}: mission, recent news, tech stack, culture, what they value in candidates. Format as newline-separated bullet points starting with •>",
  "culture_traits": ["trait1", "trait2", "trait3"]
}
===JSON_END===
`;

export const JUDGE_CORRECTION_PROMPT = (score: number, critique: string) => `
Your previous analysis was rejected by the quality evaluator.
Score: ${score}/100. Critique: ${critique}.

Re-generate the COMPLETE analysis fixing all critiqued issues.
Output format MUST follow this exact structure:
1. All required markdown sections (### Strategic Alignment, ### Match Score Breakdown, ### Learning Roadmap)
2. Then the JSON block:

===JSON_START===
{
  "match_score": <integer>,
  "verdict": "<APPLY|STRETCH|REJECT>",
  "ats_score": <integer>,
  "keyword_density": <integer>,
  "matched_skills": [],
  "missing_skills": [],
  "salary_insight": { "range": "", "currency": "", "seniority": "" },
  "red_flags": [],
  "interview_questions": [{ "q": "", "intent": "" }],
  "outreach_email": "",
  "tailored_latex": "",
  "culture_fit_score": <integer>,
  "company_cheat_sheet": ""
}
===JSON_END===
`;

export const JUDGE_PROMPT = (resume: string, jd: string, analysis: string) => `
    ROLE: Elite Senior Technical Recruiter & Quality Auditor.
    TASK: Critically evaluate the provided Resume Analysis against the original Job Description.

    INPUTS:
    - RESUME: ${resume}
    - JD: ${jd}
    - PROPOSED ANALYSIS: ${analysis}

    EVALUATION CRITERIA:
    - **Honesty Check**: Did the candidate meet the mandatory Years of Experience (YOE) requirement? If the candidate is a fresher/junior and the JD asks for 4+ years, the match score MUST be below 40%. Is the analysis being too "nice"?
    - **Evidence Check**: Is the Strategic Alignment section specific and backed by actual resume evidence?
    - **Actionability**: Is the Learning Roadmap actionable and specific to this exact role?
    - **Quality**: Are there any generic buzzwords or vague statements that add no value?

    OUTPUT:
    Return ONLY a JSON object:
    {
      "score": number,
      "critique": "string",
      "passed": boolean
    }
`;
