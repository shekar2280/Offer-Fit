import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateChunks(text: string): Promise<string[]> {
   const sections = text.split(/\n(?=[A-Z\s&/-]{4,}\n)/g);
  
  const noiseKeywords = ["education", "university", "college", "degree", "school", "cgpa", "nationality", "gender", "dob"];
  const processedChunks: string[] = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const header = lines[0].trim(); 
    const lowerHeader = header.toLowerCase();

    if (noiseKeywords.some(kw => lowerSection(section).includes(kw))) continue;

    const content = lines.slice(1).join('\n');
    const subBlocks = content.split(/\n\n/g).filter(b => b.trim().length > 30);

    for (const block of subBlocks) {
      const lowerBlock = block.toLowerCase();

      const hasEmail = lowerBlock.includes("@") || lowerBlock.includes(".com");
      const hasPhone = /(\+?\d{10,})/.test(block.replace(/[\s-]/g, ''));
      
      if (!hasEmail && !hasPhone) {
        processedChunks.push(`[${header}] ${block.trim()}`);
      }
    }
  }

  return processedChunks.length > 0 ? processedChunks : [text];
}

function lowerSection(s: string) { return s.toLowerCase(); }




export async function embedAndStore(
  supabase: any,
  analysisId: string,
  text: string,
) {
  const chunks = await generateChunks(text);

  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-2-preview",
  });

  for (const [index, chunk] of chunks.entries()) {
    try {
      const result = await model.embedContent({
        content: { role: "user", parts: [{ text: chunk }] },
        outputDimensionality: 768,
      } as any);
      const embedding = result.embedding.values;

      const { error } = await supabase.from("resume_chunks").insert({
        analysis_id: analysisId,
        content: chunk,
        embedding: embedding,
      });

      if (error)
        console.error(
          `❌ Supabase Insert Error (Chunk ${index}):`,
          error.message,
        );
    } catch (e: any) {
      console.error(`❌ Embedding Error (Chunk ${index}):`, e.message);
    }
  }
}

export async function getRelevantContext(
  supabase: any,
  analysisId: string,
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
    target_analysis_id: analysisId,
  });

  if (error || !chunks) return "";

  return chunks.map((c: any) => c.content).join("\n\n");
}
