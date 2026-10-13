import "server-only";
import { extractDocxText } from "./docx-text";
import { extractText, getDocumentProxy } from "unpdf";
import { field, HubError } from "./server";
const limit = 5 * 1024 * 1024;
export async function parseResumeUpload(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new HubError("Upload a multipart resume file.", 415);
  if (Number(request.headers.get("content-length")) > limit + 16384)
    throw new HubError("Resume must be at most 5 MB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new HubError("Choose a file.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit + 16384) {
      await reader.cancel();
      throw new HubError("Resume must be at most 5 MB.", 413);
    }
    chunks.push(value);
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new HubError("Invalid file upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > limit)
    throw new HubError("Choose a non-empty file of at most 5 MB.");
  const name = field(form.get("name") || file.name, "Name", 160, true);
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["docx", "pdf", "txt", "tex"].includes(ext))
    throw new HubError("Upload DOCX, PDF, TXT, or TEX.");
  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  if (ext === "docx") {
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50)
      throw new HubError("Invalid DOCX file.");
    try {
      text = extractDocxText(buffer);
    } catch {
      throw new HubError(
        "This DOCX is malformed, too large, or uses unsupported document features. Try a standard Word resume or PDF.",
      );
    }
  } else if (ext === "pdf") {
    if (buffer.subarray(0, 5).toString() !== "%PDF-")
      throw new HubError("Invalid PDF file.");
    const document = await getDocumentProxy(new Uint8Array(buffer));
    try {
      if (document.numPages > 20)
        throw new HubError("Resume PDFs must contain at most 20 pages.");
      const result = await extractText(document);
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } finally {
      await document.destroy();
    }
  } else text = buffer.toString("utf8");
  return {
    name,
    ext,
    buffer,
    text: field(text, "Extracted resume", 60000, true),
  };
}
