import { unzipSync } from "fflate";
import { SaxesParser } from "saxes";
const wordNamespaces = new Set([
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  "http://purl.oclc.org/ooxml/wordprocessingml/main",
]);
export function extractDocxText(data: Uint8Array): string {
  let entries = 0;
  let expandedBytes = 0;
  const files = unzipSync(data, {
    filter: (file) => {
      entries++;
      if (entries > 2000) throw new Error("Too many DOCX archive entries");
      if (/vbaProject\.bin$|\/activeX\//i.test(file.name))
        throw new Error("Active content is not supported in resume documents");
      const relevant = /^word\/(document|header\d+|footer\d+)\.xml$/.test(
        file.name,
      );
      if (relevant) {
        expandedBytes += file.originalSize;
        if (
          file.originalSize > 3 * 1024 * 1024 ||
          expandedBytes > 8 * 1024 * 1024
        )
          throw new Error("DOCX text parts exceed size limit");
      }
      return relevant;
    },
  });
  if (!files["word/document.xml"])
    throw new Error("Missing Word document part");
  const names = Object.keys(files).sort((a, b) => {
    const order = (name: string) =>
      name.includes("header") ? 0 : name.includes("footer") ? 2 : 1;
    return order(a) - order(b) || a.localeCompare(b);
  });
  const result: string[] = [];
  let textLength = 0;
  const append = (value: string) => {
    textLength += value.length;
    if (textLength > 60000)
      throw new Error("Resume text exceeds 60000 characters");
    result.push(value);
  };
  for (const name of names) {
    if (files[name].byteLength > 3 * 1024 * 1024)
      throw new Error("DOCX XML exceeds size limit");
    const parser = new SaxesParser({ xmlns: true });
    let readingText = false;
    let deleted = 0;
    let hasRoot = false;
    parser.on("doctype", () => {
      throw new Error("DOCTYPE is not allowed in resume documents");
    });
    parser.on("error", () => {
      throw new Error("Invalid DOCX XML");
    });
    parser.on("opentag", (tag) => {
      if (!hasRoot) {
        if (
          !wordNamespaces.has(tag.uri) ||
          !["document", "hdr", "ftr"].includes(tag.local)
        )
          throw new Error("Invalid Word document root");
        hasRoot = true;
      }
      if (!wordNamespaces.has(tag.uri)) return;
      if (tag.local === "del") deleted++;
      if (tag.local === "t" && deleted === 0) readingText = true;
      if (deleted === 0 && (tag.local === "tab" || tag.local === "br"))
        append(tag.local === "tab" ? "\t" : "\n");
    });
    parser.on("text", (value) => {
      if (readingText && deleted === 0) append(value);
    });
    parser.on("closetag", (tag) => {
      if (!wordNamespaces.has(tag.uri)) return;
      if (tag.local === "t") readingText = false;
      if (tag.local === "p" && deleted === 0) append("\n");
      if (tag.local === "del") deleted--;
    });
    parser
      .write(new TextDecoder("utf-8", { fatal: true }).decode(files[name]))
      .close();
    if (!hasRoot) throw new Error("Empty Word document part");
  }
  return result.join("").trim();
}
