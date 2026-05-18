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

export const USAGE_LIMITS = {
  DAILY_QUOTA: 15,
  HOURLY_QUOTA: 5,
  DAILY_REFRESH_MS: 86400000,
  HOURLY_REFRESH_MS: 3600000,
} as const;
