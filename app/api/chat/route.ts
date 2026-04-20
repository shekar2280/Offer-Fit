import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { messages, analysisId } = await req.json();
  const supabase = await createClient();

  const lastMessage = messages[messages.length - 1].content;

  const context = await getRelevantContext(supabase, analysisId, lastMessage);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const augmentedPrompt = `
    You are a professional technical recruiter. 
    Using ONLY the following retrieved segments from the candidate's resume, compare them against the Job Description.

    CANDIDATE RESUME CONTEXT:
    ${context || "No relevant segments found in the resume."}

    JOB DESCRIPTION / REQUEST:
    ${lastMessage}

    Provide:
    1. A Match Score (0-100%).
    2. Top 3 "Missing Links" (Skills or experiences the JD wants but these segments lack).
    3. 3 specific bullet points to add to the resume to better align with this JD using the context provided.
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
