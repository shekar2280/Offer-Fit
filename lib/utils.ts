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
