import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EMAIL_PROMPT } from "@/lib/ai/email-prompt";
import { GEMINI_MODELS } from "@/lib/constants";
import { withRetry } from "@/lib/ai/utils";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { analysisId } = body;

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("company_name, position, jd_text")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis) return new Response(`Analysis not found (id: ${analysisId})`, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, resume_text")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || "the candidate";

  const prompt = EMAIL_PROMPT(
    analysis.company_name,
    analysis.position,
    "local",
    userName,
    profile?.resume_text || "",
    analysis.jd_text || "",
  );

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullEmail = "";
      try {
        const result = await withRetry(() => model.generateContentStream(prompt));
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullEmail += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        
        await supabase
          .from("analyses")
          .update({ outreach_email: fullEmail })
          .eq("id", analysisId)
          .eq("user_id", user.id);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Failed to generate email" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
