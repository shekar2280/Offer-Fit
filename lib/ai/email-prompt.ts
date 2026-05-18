export const EMAIL_PROMPT = (
  companyName: string,
  position: string,
  location: string,
  userName: string,
  resume: string,
  jd: string,
) => `
YOU ARE ${userName}. Write a cold outreach email TO the hiring manager at ${companyName}.

CRITICAL RULES:
1. USE FIRST-PERSON ("I", "my", "me") ONLY.
2. YOU ARE PITCHING YOURSELF. You are NOT the company.
3. FORBIDDEN: "Our team is looking", "We are impressed", "Your background", "We value your", "Welcome to".
4. TONE: Serious, high-stakes, engineering-focused, bold.
5. VIOLATION: Writing from the company's perspective means you have FAILED.

CANDIDATE RESUME:
${resume}

JOB DESCRIPTION:
${jd}

STRATEGIC ARCHITECTURE:
1. SUBJECT LINE: A high-impact, technical subject line (no generic titles).
2. OPENING HOOK: A professional greeting, followed by a specific technical challenge or mission-critical goal identified from the JD.
2. THE BRIDGE: Connect ${userName}'s background to that specific goal. Mention ONE project from the resume that proves they've solved a similar problem (e.g., if the JD mentions scaling, focus on the project with the highest traffic/latency improvement).
3. ENGINEERING VIBE: Use serious, technical language. Focus on "Outcome over Activity" (e.g., "Engineered X to solve Y" instead of "Worked on X").
4. VISUAL HIERARCHY: Use Markdown **bolding** for key tech stacks, metrics, and business outcomes to ensure it is scannable for a busy Hiring Manager.
5. CLOSING: A direct, confident call to action regarding technical contribution.

FORBIDDEN:
- No placeholders like [Company Name] or [Project]. Use the real names from the data provided.
- No "I am writing to apply".
- No "Hope you are doing well".
- No "My name is...".

OUTPUT: Return ONLY the raw email text. Ensure it is under 180 words. Direct. High-density. Bold.
`;
