export const ANALYSIS_PROMPT = (companyName: string, position: string, context: string, jd: string, location?: string, jobType?: string) => `
    ROLE: Elite Technical Hiring Manager & Agentic Career Strategist.
    CONTEXT: ${companyName} | ${position} ${location ? `| Location: ${location}` : ""} ${jobType ? `| Job Type: ${jobType}` : ""}
    CANDIDATE RESUME: ${context}
    TARGET JD: ${jd}

    TASK: Perform a deep-dive analysis. 
    INSTRUCTION: If you need specific market data or if the resume is in LaTeX, use the provided tools first.
    CRITICAL CHECK: Analyze if the candidate's experience level matches the "Job Type" (e.g., if they are a Senior applying for an Internship, or vice versa, flag it and factor it into the verdict and match score).
    
    OUTPUT FORMAT:
    1. Start with a detailed markdown analysis.
    2. End with the delimiter: "---METADATA---"
    3. Return a valid JSON object EXACTLY matching this schema:
    {
      "matchScore": number (0-100),
      "verdict": "APPLY" | "STRETCH" | "PASS",
      "atsScore": number (0-100),
      "keywordDensity": number (0-100),
      "matchedSkills": ["skill1", "skill2"],
      "missingSkills": ["skill1", "skill2"],
      "salaryInsight": { "range": "string", "currency": "string", "seniority": "string" },
      "redFlags": ["flag1"],
      "interviewQuestions": [{ "q": "question", "intent": "why ask this" }],
      "outreachEmail": "Draft email to recruiter"
    }
`;

export const JUDGE_CORRECTION_PROMPT = (score: number, critique: string) => `
    The Judge rejected your work. Score: ${score}. Critique: ${critique}. PLEASE FIX AND RE-GENERATE.
`;

export const JUDGE_PROMPT = (resume: string, jd: string, analysis: string) => `
    ROLE: Elite Senior Technical Recruiter & Quality Auditor.
    TASK: Critically evaluate the provided Resume Analysis against the original Job Description.

    INPUTS:
    - RESUME: ${resume}
    - JD: ${jd}
    - PROPOSED ANALYSIS: ${analysis}

    GRADING RUBRIC (0-10):
    1. Accuracy: Does it correctly identify skills the candidate DOES and DOES NOT have?
    2. Depth: Is the analysis "brutal" and tactical, or just generic "fluff"?
    3. Actionability: Are the "Bullet Suggestions" high-quality and LaTeX-ready (if applicable)?
    4. Tone: Is the response professional, authoritative, and helpful (not robotic)?
    5. Length: Is the analysis sufficiently detailed (at least 300-500 words)?

    OUTPUT:
    Return ONLY a JSON object:
    {
      "score": number,
      "critique": "What exactly was missed or could be better?",
      "passed": boolean (true if score >= 8)
    }
`;
