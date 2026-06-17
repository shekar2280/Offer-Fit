# Offer Fit — Evaluation Suite

This directory contains the automated evaluation suite to guarantee the accuracy and robustness of the Offer Fit AI pipeline.

For a high-level overview of the architecture and benchmark results, please see the [Main Project README](../README.md).

## How the Benchmark Works

The benchmark script runs every test case **twice** for the analyze route:

- **Raw run** (`bypassJudge: true`) — captures the primary agent's unreviewed verdict.
- **Reliable run** (`bypassJudge: false`) — runs the full pipeline including Appellate Judge review.

The `Judge Uplift` metric measures how often the Judge corrected a wrong Raw verdict to the expected one. A `[JUDGE OVERRIDE]` tag appears in the output only when the Judge disagrees with the primary agent and forces a correction.

## Running the Benchmark

Both services must be running before executing the benchmark.

```bash
# Terminal 1 — start the Next.js frontend
cd frontend && npm run dev

# Terminal 2 — start the FastAPI backend
cd backend && uvicorn app.main:app --reload

# Terminal 3 — run the benchmark from the evals directory
cd evals
npm install
npm run benchmark
```

## Dataset

| Prefix | Mode | Count | Description |
|---|---|---|---|
| `01_` – `43_` | Analyze | 7 | Core traps: hard reject, soft mismatch, perfect match, seniority faker, scale mismatch, domain pivot, YOE overlap |
| `44_` | Analyze | 3 | Extra edge cases: Node vs Python role, junior vs mid-level, overqualified director |
| `50_` | Customize | 10 | Keyword injection across 10 different JD profiles (mobile, fullstack, backend, AI, fintech) |

## Structure

```
evals/
├── dataset/            — 20 JSON test cases
├── scripts/
│   └── benchmark.ts   — Test runner (analyze + customize)
├── package.json       — Dependencies for the test runner
└── master_resume.tex  — Canonical LaTeX resume used by all customize tests
```
