export const MODEL_PRICING = {
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.50 },
  "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "gemini-3-flash": { input: 0.50, output: 3.00 },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
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
  "Applying reliability audit..."
];

export const USAGE_LIMITS = {
  DAILY_QUOTA: 15,
  HOURLY_QUOTA: 5,
  DAILY_REFRESH_MS: 86400000,
  HOURLY_REFRESH_MS: 3600000,
} as const;
