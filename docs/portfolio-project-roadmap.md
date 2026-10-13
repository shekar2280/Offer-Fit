# OfferFit: portfolio delivery plan

Planning date: 10 October 2026. Audience: the developer building OfferFit and hiring reviewers assessing the finished project.

## Product thesis and architecture decision

OfferFit helps an early-career applicant turn a job description into an evidence-backed application and track what happens next. The strongest demo is one complete application lifecycle, with observable AI decisions and reliable persistence.

Choose Approach B, a tab-scoped portal. Daily workflow: open Overview → review next steps → open Analyze & tailor for a specific role → inspect fit and integrity results → export a resume → update Applications → return to History when comparing past work. Focused routes make this workflow easy to explain, test, and extend. Overview brings recent work and pending actions together without embedding the entire analysis studio or requiring modal navigation.

Keep the existing amber/navy theme. Main navigation: Overview, Analyze & tailor, Applications, History. Profile contains the master resume and project evidence; Hub Settings contains integrations. Keep existing `/analyze`, `/customize`, `/history`, and `/hub?view=...` URLs working.

## Implemented in this iteration

- Homepage always renders a scrollable Overview rather than switching completely between the upload chooser and Job Hub.
- Shared route navigation appears with the existing Navbar, including in the analysis studio and history.
- Overview queries real completed-analysis and saved-tailoring counts, five recent analyses, and saved resume readiness. It links directly to existing analysis IDs.
- Hub summaries reuse the Job Hub query cache and existing follow-up rules. Missing Hub setup does not block analysis/history/profile sections. Unknown values render as unavailable rather than zero.
- `NEXT_PUBLIC_JOB_HUB_ENABLED=true` enables application summaries on Overview. It no longer replaces the entire homepage. `/hub` remains directly accessible for deployment validation.
- Application counts use the existing Hub endpoint's latest-500-record window, disclosed when reached. These are opportunities, including saved and preparing roles, rather than a count of submitted applications.

This iteration does not add an average ATS score, a new AI scoring model, or automatic analysis-to-application linking. Those require clearly defined data semantics and are tracked below.

## Database blocker and recovery

A read-only check against the configured Supabase project on 10 October returned HTTP 404 and `PGRST205` for `hub_applications`, `hub_resumes`, and `hub_events`. This means the REST API cannot find those tables in its schema cache. The likely cause is the unapplied Hub migration; if SQL catalogs already contain the tables, investigate schema exposure/cache before rerunning it.

1. Open the intended Supabase project's SQL Editor. Inspect `supabase/verify_job_hub.sql` first. Confirm the selected project and preserve a database backup before changing production.
2. When the objects are absent, apply the **complete** `supabase/migrations/202610080001_job_hub.sql`. It includes tables, ownership policies, transaction functions, scheduler state, and private resume storage. Applying only three table definitions is insufficient.
3. Run `supabase/verify_job_hub.sql` again. Every table must exist with RLS enabled, every listed function must exist, and the resume bucket must be private. This catalog check does not prove correct ownership enforcement; run the two-account checklist in `docs/job-hub-deployment.md` too.
4. Sign in and verify `GET /api/hub` returns 200. Create one role, refresh, edit its status, and confirm its timeline persists. Verify analysis/indexing still work.
5. Set `NEXT_PUBLIC_JOB_HUB_ENABLED=true`, restart development or rebuild the deployment, and verify Overview summaries.

The migration uses plain `CREATE TABLE`/`CREATE FUNCTION` statements inside a transaction; it is not a repeatable setup script. Do not blindly re-run it over an already provisioned Hub. Do not re-run the legacy base setup to fix Hub tables. If the SQL execution fails, inspect the first error and transaction result before retrying.

No hosted migration has been applied by this iteration. There is no connected SQL editor, management API, or database connection in the coding session. A Supabase service-role REST key alone does not expose arbitrary DDL execution.

## Milestones in delivery order

| Milestone | Deliverables | Exit evidence |
| --- | --- | --- |
| 1. Reliable vertical slice | Apply and verify Hub migration; exercise authentication, upload, parse, index, analyze, tailor, export, and tracking for one role; retain graceful errors | A fresh account completes the workflow; reload preserves work; another account cannot read it; deployed Hub responds 200 |
| 2. Connected role workspace | Add an explicit application-to-analysis association through an additive migration; persist application context through Analyze and Customize; attach the exact resume version; provide a “Save to tracker” action with duplicate handling | Opening a saved role restores JD and analysis; tailoring does not mark it submitted; submitted resume version remains fixed after later edits |
| 3. AI quality and operational evidence | Version prompts/model/provider; maintain representative held-out evaluation cases; measure fit consistency, unsupported facts, extraction failures, latency, and token usage; expose reviewed limitations | Reproducible evaluation command, dataset provenance, actual baseline/results, and measured p50/p95 latency from runs |
| 4. Recruiter-ready release | Verify responsive and keyboard flows; document architecture and setup; add CI checks and deployment smoke checks; record demo; write a concise case study | A live deployment, setup from a clean clone, passing CI, 2–3 minute walkthrough, and README evidence matching the shipped version |

Treat these as ordered scopes, not a promise of fixed completion dates. Complete milestone 1 before adding breadth.

## Component and data boundaries

- Next.js owns authenticated UI, server API gateways, and integration callbacks. Keep Supabase session/owner enforcement at every data boundary.
- FastAPI owns the existing AI pipeline. Keep provider keys on the server and validate structured output before storing or rendering it.
- PostgreSQL stores profiles, analyses, application state, immutable resume versions, event history, and integration state. Supabase Storage stores private originals/exports. pgvector supports retrieval; document what is retrieved and how it improves the output.
- TanStack Query manages per-view loading, retry, and cache invalidation. Overview must not require all modules to succeed at once.
- Application identity anchors the captured JD, analysis, exact resume version, and outreach. Use explicit foreign keys and ownership constraints in the next migration; do not infer identity solely from company name.
- Keep the current bounded Hub query for initial use. Before expanding usage, add a lightweight aggregate endpoint and paginated application queries so Overview does not download resume contents and draft bodies.

## Feature priorities

**Core release:** a reliable resume/JD workflow, truthful tailoring, integrity review, downloadable output, saved history, application CRUD and status timeline, linked resume version, clear empty/error states, user isolation, and a complete demo.

**After the core release:** evidence-backed outreach drafts and manual Gmail sync with review of ambiguous matches. Existing integration code is useful groundwork, but hosted OAuth, token lifecycle, disconnect, and account isolation must be verified before claiming the feature works publicly.

**Later expansion:** scheduled Gmail sync, richer analytics, more export templates, directory expansion, and extension polish. Do not make a large company directory or an always-on scheduler a dependency of the core hiring demo.

## Quality and acceptance checklist

- Check both flag states: Overview remains available; disabled application summaries make no `/api/hub` request. Test the enabled state with missing tables and with a provisioned Hub.
- Test empty history, saved history, upload failure, AI timeout, unavailable backend, and expired session. Failed operations must not look successful or erase the user's draft.
- Review Overview and studio on a narrow mobile viewport and desktop; navigation must scroll horizontally and remain reachable by keyboard.
- Verify the generated resume against original facts and selected project evidence. Describe scores as model assessments; do not promise hiring outcomes or employer ATS compatibility.
- Run `npx tsc --noEmit`, scoped ESLint, `npm run test:hub`, and `npm run build` from `frontend`. Add end-to-end coverage for the connected lifecycle once milestone 2 exists.
- Review deletion, private storage access, duplicate jobs, stale revisions, and two-user isolation using staging accounts. Existing local PostgreSQL tests are supporting evidence, not hosted OAuth verification.
- Capture actual evaluation results and environment/version details. The current README benchmark sample must be labeled with its dataset size; small samples do not establish general accuracy.

## Validation recorded for this iteration

`npx tsc --noEmit`, scoped ESLint, and all seven `npm run test:hub` tests passed. The PostgreSQL test also executes `supabase/verify_job_hub.sql` and verifies all nine tables have RLS, all nine expected functions exist, and the resume bucket is private.

`npm run build -- --webpack` passed and generated all 43 pages. The default Turbopack build encountered a Windows CSS-worker process crash after network restrictions on font downloads were removed; the supported Webpack build validated compilation, TypeScript, and prerendering. This does not resolve the Turbopack runtime issue.

No signed-in visual review, hosted migration, or hosted OAuth smoke test was completed in this session. Those remain release acceptance tasks.

## Hiring presentation

Lead the README with the problem, a live demo link, a screenshot of Overview, and a short complete workflow. Then show one architecture diagram, explain retrieval and the integrity audit, document database ownership and transactional updates, and link measured evaluation results and setup instructions. Correct framework/version badges to match the checked-in dependencies.

Suggested demo: upload a real resume → capture one junior role → explain a fit gap → tailor an evidence-supported bullet → inspect the audit → download → record the application → reload the tracker and history. Explain one failure case and its recovery.

Resume bullet template **after shipping and measuring**:

> Built OfferFit, a Next.js/FastAPI application combining Supabase authentication, PostgreSQL/pgvector retrieval, and Gemini resume analysis with an application tracker; evaluated [N] representative cases and measured [result] under [test conditions].

Fill brackets with measured facts. Avoid claiming production users, improved interview rates, or accuracy numbers without recorded evidence.
