export const MODEL_PRICING = {
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.5 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-3-flash": { input: 0.5, output: 3.0 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
} as const;

export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3-flash",
  "gemini-2.5-flash",
] as const;

export const LOADING_MESSAGES = [
  "Indexing resume context...",
  "Analyzing JD...",
  "Finding matches...",
  "Optimizing LaTeX...",
  "Applying reliability audit...",
];

export const PLAN_QUOTAS = {
  free: 20,
  premium: 50,
} as const;

export type PlanType = keyof typeof PLAN_QUOTAS;

export function getMidnightISTResetMs(): number {
  const now = new Date();
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const midnightIST = new Date(
    Date.UTC(
      nowIST.getUTCFullYear(),
      nowIST.getUTCMonth(),
      nowIST.getUTCDate() + 1,
      0, 0, 0, 0
    ) - IST_OFFSET_MS
  );
  return midnightIST.getTime() - now.getTime();
}

export function isPastMidnightIST(lastRequestAt: string | Date): boolean {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const last = new Date(lastRequestAt);
  const now = new Date();
  const toISTDay = (d: Date) => {
    const ist = new Date(d.getTime() + IST_OFFSET_MS);
    return `${ist.getUTCFullYear()}-${ist.getUTCMonth()}-${ist.getUTCDate()}`;
  };
  return toISTDay(last) !== toISTDay(now);
}

export const USAGE_LIMITS = {
  DAILY_QUOTA: 20,
  DAILY_REFRESH_MS: 86400000,
} as const;
