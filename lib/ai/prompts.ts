export const ANALYSIS_PROMPT = (
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode: "analyze" | "customize" = "analyze"
) => `
    ROLE: Elite Technical Hiring Manager & Agentic Career Strategist.
    CONTEXT: ${companyName} | ${position} ${location ? `| Location: ${location}` : ""} ${jobType ? `| Job Type: ${jobType}` : ""}
    CANDIDATE RESUME: ${context}
    TARGET JD: ${jd}

    TASK: Perform a deep-dive analysis. 
    INSTRUCTION: If you need specific market data or if the resume is in LaTeX, use the provided tools first.
    CRITICAL CHECK: Analyze if the candidate's experience level matches the "Job Type".
    
    Current Mode: ${mode.toUpperCase()}

    ${mode === "analyze" ? `
    GOAL: Generate a "Learning Roadmap" for the user to bridge the gap between their resume and the JD.
    REQUIRED SECTIONS:
    ## Executive Summary
    ## To Fulfill JD Requirements
    ## Strategic Advice
    ` : `
    GOAL: Generate a tailored LaTeX resume and list of improvements.
    REQUIRED SECTIONS:
    ## Tailored LaTeX Resume
    ## Actionable Resume Improvements
    `}

    OUTPUT FORMAT:
    1. Start with a detailed markdown analysis. DO NOT include lists of Matched Skills, Missing Skills, Salary, Red Flags, or Interview Questions in the Markdown.
    2. End with the delimiter: "---METADATA---"
    3. Return a valid JSON object EXACTLY matching this schema:
    {
      "match_score": number,
      "verdict": "APPLY" | "STRETCH" | "PASS",
      "ats_score": number,
      "keyword_density": number,
      "matched_skills": [],
      "missing_skills": [],
      "salary_insight": { "range": "string", "currency": "string", "seniority": "string" },
      "red_flags": [],
      "interview_questions": [{ "q": "string", "intent": "string" }],
      "outreach_email": "string",
      "tailored_latex": "string"
    }
`;

export const JUDGE_CORRECTION_PROMPT = (score: number, critique: string) => `
    The Judge rejected your work. Score: ${score}. Critique: ${critique}. PLEASE FIX AND RE-GENERATE.
    CRITICAL INSTRUCTION: Output ONLY the corrected markdown, followed by ---METADATA---, followed by the JSON.
`;

export const JUDGE_PROMPT = (resume: string, jd: string, analysis: string) => `
    ROLE: Elite Senior Technical Recruiter & Quality Auditor.
    TASK: Critically evaluate the provided Resume Analysis against the original Job Description.

    INPUTS:
    - RESUME: ${resume}
    - JD: ${jd}
    - PROPOSED ANALYSIS: ${analysis}

    OUTPUT:
    Return ONLY a JSON object:
    {
      "score": number,
      "critique": "string",
      "passed": boolean
    }
`;
