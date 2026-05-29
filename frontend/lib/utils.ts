import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function sanitizeMd(text: string): string {
    return text
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
        .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
        .replace(/^>+\s*/gm, "")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

interface ParsedJd {
    cleanJd: string;
    location: string;
    jobType: string;
}

export function parseJdText(jdText: string): ParsedJd {
    if (!jdText) return { cleanJd: "", location: "", jobType: "" };
    
    const metadataRegex = /^<!--METADATA:\s*({.*?})\s*-->\n*/;
    const match = jdText.match(metadataRegex);
    
    if (match) {
        try {
            const metadata = JSON.parse(match[1]);
            return {
                cleanJd: jdText.replace(metadataRegex, ""),
                location: metadata.location || "",
                jobType: metadata.jobType || "",
            };
        } catch (e) {
            console.error("Failed to parse metadata", e);
        }
    }
    
    return { cleanJd: jdText, location: "", jobType: "" };
}

export function stringifyJdText(jdText: string, location: string, jobType: string): string {
    if (!location && !jobType) return jdText;
    const metadata = { location, jobType };
    return `<!--METADATA: ${JSON.stringify(metadata)}-->\n${jdText}`;
}
