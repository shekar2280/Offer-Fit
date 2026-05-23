import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EMAIL_PROMPT } from "@/lib/ai/email-prompt";
import { GEMINI_MODELS, USAGE_LIMITS } from "@/lib/constants";
import { withRetry } from "@/lib/ai/utils";
import { checkRateLimit } from "@/lib/redis";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const dailyLimitCheck = await checkRateLimit(
    `rate:daily:${user.id}`,
    USAGE_LIMITS.DAILY_QUOTA,
    USAGE_LIMITS.DAILY_REFRESH_MS,
  );
  if (!dailyLimitCheck.success) {
    return new Response(
      JSON.stringify({
        error: `Daily quota reached (${USAGE_LIMITS.DAILY_QUOTA}/day). Resets in ${Math.round(dailyLimitCheck.resetMs / 1000 / 60 / 60)} hours.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  supabase
    .rpc("increment_user_usage", { p_user_id: user.id })
    .then(() => {});

  const body = await req.json();
  const { analysisId } = body;

  const { data: analysis } = await supabase
    .from("analyses")
    .select("company_name, position, jd_text")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis)
    return new Response(`Analysis not found (id: ${analysisId})`, {
      status: 404,
    });

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
        const { totalTokens: inputTokens } = await model.countTokens(prompt);

        const result = await withRetry(() =>
          model.generateContentStream(prompt),
        );
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullEmail += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }

        const { totalTokens: outputTokens } = await model.countTokens(fullEmail);
        const emailCost = ((inputTokens * 0.25) + (outputTokens * 1.50)) / 1000000;

        const { data: existingAnalysis } = await supabase
          .from("analyses")
          .select("total_tokens, estimated_cost")
          .eq("id", analysisId)
          .eq("user_id", user.id)
          .single();

        const existingTokens = Number(existingAnalysis?.total_tokens || 0);
        const existingCost = Number(existingAnalysis?.estimated_cost || 0);

        await supabase
          .from("analyses")
          .update({
            outreach_email: fullEmail,
            total_tokens: existingTokens + inputTokens + outputTokens,
            estimated_cost: existingCost + emailCost
          })
          .eq("id", analysisId)
          .eq("user_id", user.id);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Failed to generate email" })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
