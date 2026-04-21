import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { messages, analysisId, companyName, position } = await req.json();
  const supabase = await createClient();

  const lastMessage = messages[messages.length - 1].content;

  const context = await getRelevantContext(supabase, analysisId, lastMessage);

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
  });

  const augmentedPrompt = `
    ROLE: You are a Distinguished Technical Strategist and Executive Recruiter in the high-stakes 2026 environment.
    OBJECTIVE: Conduct a "Systemic Hiring Audit" of the candidate against the target role. 
    TONE: Professional, analytical, and uncompromisingly honest. 

    TARGET ENTITY: ${companyName || "Target Organization"}
    TARGET ROLE: ${position || "Specialized Position"}

    CANDIDATE BIOGRAPHY (Segments):
    ${context || "Baseline resume context unavailable."}

    JD / MARKET CONTEXT:
    ${lastMessage}

    INSTRUCTIONS:
    Evaluate the candidate not just on keywords, but on "Project Scale" and "Technical Depth." 
    If the candidate is a fit, explain the ROI of hiring them. If not, define the "Opportunity Cost" of their missing skills.

    RESPONSE STRUCTURE (Markdown):

    # VERDICT: [APPLY / PASS]
    # OVERALL STRATEGIC MATCH: [XX]%
    
    ## 📊 Hiring Alignment Analysis
    - **Cultural Infusion (Company Fit):** [XX]% — [One sentence on brand/value alignment]

    ## 🎙️ The Recruiter’s Private Assessment
    > [!NOTE]
    > **Strategic Whisper:** "[Write a thought-provoking, high-level analysis of the candidate's biggest unique advantage and their most concerning hidden risk for this specific role.]"

    ## 🎡 Career Trajectory Forecast
    - **Brand Power:** [XX]% 
    - **Technical Growth:** [XX]% 
    - **AI-Safety (Future-Proofing):** [XX]% 
    - **Network Leverage:** [XX]% 

    ## 🔍 Deep Identity Analysis
    - **Company Dynamics:** [A deep, 2-sentence look at the company’s current roadmap and why this role exists.]
    - **Role Impact:** [The true influence of this position within the organization.]

    ## ⚔️ The Gap Audit (Non-Negotiable)
    > [!CAUTION]
    > **Critical Deficit:** [Identify 1-2 major conceptual or technical gaps that could cause an interview failure.]
    
    - **Skill Divergence:** [List specific mismatches]
    - **Experience Scale:** [Analysis of whether their past projects match the target's scale]

    ## 📈 Visual Skill Map (Era 2026)
    - Core Tech Match: [▓▓▓▓▓░░░░░] 50%
    - Leadership Match: [▓▓▓▓▓▓▓▓░░] 80%
    - Future-Proofing: [▓▓▓░░░░░░░] 30%

    ## 🚀 Execution Strategy
    1. **Immediate Resume Refactor:** [A high-impact instruction to change one specific part of the resume.]
    2. **High-Value Interview Hook:** [The "Hero Story" the candidate must tell during the interview.]
    3. **2026 Market Edge:** [A secret tip for winning in the current high-competition landscape.]
  `;

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: augmentedPrompt }] }],
  });

  const responseStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        controller.enqueue(new TextEncoder().encode(chunkText));
      }
      controller.close();
    },
  });

  return new Response(responseStream);
}

