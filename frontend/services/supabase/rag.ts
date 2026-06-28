import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { logSystemEvent } from "@/services/supabase/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function stripLatex(text: string): string {
  const isLatex = text.includes("\\documentclass") || text.includes("\\begin{document}");
  if (!isLatex) return text;
  return text
    .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, "")
    .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, "")
    .replace(/\\begin\{document\}|\\end\{document\}/g, "")
    .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, "\n")
    .replace(/\\(?:section|subsection|subsubsection|textbf|textit|emph|href|url|textcolor|colorbox)\{([^}]*)\}/g, "$1")
    .replace(/\\(?:item|resumeItem)\s*/g, "\n- ")
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?\{([^}]*)\}/g, "$2")
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?/g, " ")
    .replace(/\{|\}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateChunks(text: string): Promise<string[]> {
  const cleanText = stripLatex(text);
  const sections = cleanText.split(/\n(?=[A-Z\s&/-]{4,}\n)/g);

  const noiseKeywords = [
    "education",
    "university",
    "college",
    "degree",
    "school",
    "cgpa",
    "nationality",
    "gender",

  ];
  const processedChunks: string[] = [];

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines[0].trim();

    if (noiseKeywords.some((kw) => lowerSection(section).includes(kw)))
      continue;

    const content = lines.slice(1).join("\n");
    const subBlocks = content
      .split(/\n\n/g)
      .filter((b) => b.trim().length > 30);

    for (const block of subBlocks) {
      const lowerBlock = block.toLowerCase();

      const hasEmail = lowerBlock.includes("@") || lowerBlock.includes(".com");
      const hasPhone = /(\+?\d{10,})/.test(block.replace(/[\s-]/g, ""));

      if (!hasEmail && !hasPhone) {
        processedChunks.push(`[${header}] ${block.trim()}`);
      }
    }
  }

  return processedChunks.length > 0 ? processedChunks : [text];
}

function lowerSection(s: string) {
  return s.toLowerCase();
}

export async function embedAndStore(
  supabase: SupabaseClient,
  userId: string,
  text: string,
) {
  await supabase.from("resume_chunks").delete().eq("user_id", userId);

  const chunks = await generateChunks(text);
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-2-preview",
  });

  for (const chunk of chunks) {
    try {
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text: chunk }] },
        outputDimensionality: 768,
      } as any);
      const embedding = result.embedding.values;

      await supabase.from("resume_chunks").insert({
        user_id: userId,
        content: chunk,
        embedding: embedding,
      });
    } catch (e: unknown) {
      await logSystemEvent({
        level: "ERROR",
        source: "SUPABASE_RAG",
        message: "Embedding chunk failed",
        details: { error: (e as Error).message }
      });
    }
  }
}

export async function getRelevantContext(
  supabase: SupabaseClient,
  userId: string,
  query: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-2-preview",
  });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text: query }] },
    outputDimensionality: 768,
  } as any);
  const embedding = result.embedding.values;

  const { data: chunks, error } = await supabase.rpc("match_resume_chunks", {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
    target_user_id: userId,
  });

  if (error || !chunks) return "";

  await logSystemEvent({
    level: "INFO",
    source: "RAG_RETRIEVAL",
    message: `Retrieved ${chunks.length} resume chunks`,
    details: {
      chunks_retrieved: chunks.map((c: { content?: string } & Record<string, unknown>, i: number) => ({
        index: i + 1,
        similarity: c.similarity,
        preview: c.content?.substring(0, 120)
      }))
    }
  });

  return chunks.map((c: { content?: string } & Record<string, unknown>) => c.content || "").join("\n\n");
}
