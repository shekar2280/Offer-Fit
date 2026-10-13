# OfferFit daily job-search hub

Planning baseline: 8 October 2026. This document describes proposed work; it does not claim that Gmail is connected or that 300 companies have already been verified.

## Product outcome

Turn OfferFit into one daily workspace for discovering companies, capturing roles, analyzing fit, tailoring resumes, drafting outreach, tracking applications, and reviewing recruiter replies. Preserve the existing amber `#F2AA4C`, navy `#101820`, black backgrounds, typography, and component styling.

Confirmed targeting: 0 years of professional experience; frontend, backend, full-stack, Python, AI, and GenAI roles in India or remote roles explicitly open to India. Prioritize fresher, graduate, trainee, junior, and suitable internship openings. Preferred cities remain configurable. Confirmed LLM provider: Gemini.

## What the repository already provides

- Next.js/React frontend, Supabase authentication and persistence, FastAPI AI backend, and Gemini integration.
- Analyze and Customize flows, saved analysis history, company research, and integrity checks.
- DOCX/PDF text extraction through `frontend/app/api/parse/route.ts`. Extraction currently stores text in the profile; this is not a resume file library or formatting-preserving DOCX editing.
- GitHub project evidence through the existing project intelligence and backend sync features. Reuse this to support truthful resume bullets and outreach.
- Chrome extension scraping and transfer into Analyze/Customize. It does not currently look up tracked applications or autofill application forms.
- Existing database usage in code, but the referenced setup SQL is ignored by Git. Add versioned additive migrations and inspect the deployed schema before applying them.

## Navigation and daily workflow

| View | Main purpose |
| --- | --- |
| Today | Daily check-in, streak, actionable email updates, overdue follow-ups, application goal, recommended companies |
| Applications | Searchable table and optional board; company, role, status, applied date, resume used, next action |
| Companies | Approximately 300 verified career destinations with category, location, funding evidence, YC batch, and saved companies |
| Role workspace | Job description, Analyze, Customize, cold email, notes, and status history in one application context |
| Resumes | Original files, master resume, tailored versions, previews, downloads, and linked applications |
| Outreach | Company-specific drafts, reusable templates, follow-up drafts, and manually recorded sent dates |
| Settings | Gmail connection, LLM provider/key, GitHub evidence, goals, timezone, sync controls |

Preserve `/analyze`, `/customize`, and `/history` links. They should open the appropriate workspace tab; importing historical analyses must not mark them as submitted applications.

Daily sequence: check in → review replies → handle due follow-ups → discover suitable roles → capture job → analyze → tailor resume → draft outreach → apply → record submission. Save work progressively so the extension and website see the same data.

## Application model and status rules

Use one shared application record as the anchor for the job URL, analysis, resume version, email threads, notes, and outreach.

Statuses: `saved`, `preparing`, `applied`, `acknowledged`, `assessment`, `interview`, `offer`, `accepted`, `rejected`, `withdrawn`, `closed`.

- An acknowledgement is not an interview or offer. An offer is not accepted until the user accepts it.
- Opening a careers page or generating a resume does not mean the user applied.
- Store application submission separately from outreach sent time; a cold email need not be a formal application.
- After more than 10 calendar days without a substantive reply, show a derived `follow-up due` flag. Do not change the underlying status to rejected.
- First follow-up uses submission time, or outreach time for outreach-only records. Later follow-ups use the latest substantive reply or confirmed follow-up; automated acknowledgements do not keep delaying reminders.
- Terminal outcomes stop follow-up reminders. Interviews and assessments use explicit next-action dates rather than generic silence reminders.
- Add filters for no response over 10 days, new replies, interviews, rejected, company, role, location, and resume version.
- Keep an append-only status timeline with source, evidence, effective time, recorded time, and manual overrides. Delayed emails must not regress newer states; correction and undo remain available.
- Store UTC timestamps and a user timezone, default `Asia/Kolkata`. One check-in per user/local date; opening multiple tabs does not increase the counter. Track applications submitted separately from check-ins and AI credits.

## Gmail integration

Connect Gmail separately from OfferFit sign-in. The user may sign in with GitHub and connect a different Gmail account.

1. Add an authenticated Google OAuth connect/callback/disconnect flow with state validation and server-side token exchange. Request offline access and the minimum read scope needed to examine replies.
2. Encrypt refresh tokens at rest with a server-held encryption key. Do not expose them to browser storage, extension content scripts, client-readable Supabase rows, logs, or LLM prompts.
3. Start with manual Sync and sync on daily check-in, with a bounded initial lookback selected by the user. Fetch candidate application messages and paginate; do not send the entire mailbox to an LLM.
4. Match threads using confirmed thread IDs, ATS requisition IDs, job links, company domain, role, and application timing. ATS domains alone and company names alone are insufficient, especially for multiple roles at one company.
5. Classify as acknowledgement, assessment, interview, rejection, offer, or unknown. Store a short explanation and message link. Apply explicit, well-matched updates automatically; ambiguous company/role matches go to a review inbox.
6. Manual corrections pin the corrected state until a newer, relevant event justifies a change. Repeated processing is idempotent by Gmail message ID.
7. Show last successful sync, failures, and reconnect-required states. No emails found does not prove no response when sync is incomplete.
8. Add scheduled incremental sync on an available hosting scheduler. For near-real-time updates, use Gmail watch + Cloud Pub/Sub + authenticated webhook + durable worker, with watch renewal and history checkpoint recovery.
9. Disconnect revokes authorization and removes stored tokens; provide separate deletion controls for retained email-derived data.

Google marks `gmail.readonly` as restricted. Personal-use apps may qualify for a verification exception; public distribution needs a separate verification/security-assessment decision. Testing-mode refresh tokens generally expire after seven days with Gmail scopes, so a durable personal connection needs the correct publishing configuration and reconnect handling. Gmail watches must be renewed at least every seven days; Google recommends daily renewal.

Draft/copy/open Gmail compose is enough for the first outreach release. In-app sending or Gmail draft creation is a separate later feature requiring appropriate scopes and explicit user action.

## Resume library, DOCX tailoring, and GitHub evidence

- Store original uploads in a private Supabase Storage bucket. Record format, checksum, extraction state, original text, and resume version metadata.
- Add authenticated file access, upload size/type checks before parsing, and user ownership checks. Preserve originals permanently until the user deletes them.
- Normalize resume facts into structured sections; keep links from each fact to the source resume or user-approved GitHub evidence.
- Have the LLM return validated edits to bullets/summary/skills. Reject invented employment, degrees, metrics, dates, or unsupported skills. Let the user review changes and select supporting projects.
- Reuse the current audit pipeline and save provider/model/prompt version and parent resume ID for every output.
- Generate a new DOCX from the reviewed structured content using a controlled template and document library. An LLM does not itself preserve Word formatting; arbitrary existing layouts require additional support. Retain the existing LaTeX workflow.
- Offer preview and downloadable DOCX; add PDF export with a documented document-rendering runtime. Verify overflow, layout, clickable links, and extraction readability on representative documents.
- Pin the exact resume version to each application so later edits do not change the record of what was submitted.
- Reuse existing GitHub sync for selected repositories. Private repository access depends on granted credentials; repository access must not be assumed from the existence of a GitHub integration.

## Cold-email generator and bring-your-own key

- Inputs: company, role/JD, selected resume version, approved GitHub evidence, recipient name when known, tone, and length.
- Outputs: subject + concise body, referral request, and follow-up variants. Cite evidence internally and distinguish verified company information from assumptions.
- Keep drafts editable and versioned; support copy and open-compose. Record `sent` only after user confirmation or an eventual send API result.
- Never invent recruiter addresses or claim funding/technology information without sources. An absent contact means the user supplies one or uses the careers page.
- Add a provider abstraction using the confirmed Gemini provider and existing integration. Validate the key with a small provider request and display usage/cost where available. Additional providers are outside the initial scope.
- Store persistent keys encrypted server-side and allow rotation/deletion. For session-only use, keep the key in memory, excluding logs and persistent browser storage.
- Resolve the provider server-side for the authenticated user, so customization and outreach actually use the supplied key. Do not silently fall back to the platform key after a user-key failure.
- Rate-limit expensive actions. Use timeouts, structured output validation, and retries that cannot duplicate application changes.
- Treat company pages, JDs, repository text, and email bodies as untrusted input rather than instructions to the agent.

## Shared website/extension behavior

Normalize job identity using ATS provider + requisition ID when available; otherwise normalized role URL, then company/role/location as a possible-match fallback. Strip tracking parameters while retaining parameters that identify the role.

| Opened page | Behavior |
| --- | --- |
| New role | Parse company, role, JD, location, and source URL; preview/edit before saving |
| Previously saved role | Show saved record and offer Analyze, Customize, or continue application |
| Applied role | Show applied date, resume used, latest status, and due follow-up; offer status update |
| Terminal application | Show previous outcome; offer a distinct reapplication only after confirmation |
| Company careers homepage | Show applications at that company; do not equate all roles at the company |
| Uncertain duplicate | Show possible matches and let the user resolve them |

- Introduce extension background/service-worker communication and scoped, revocable pairing credentials. Content scripts must not receive account-wide credentials.
- Restrict the current `window.postMessage` bridge to configured OfferFit origins, validate schemas and source/origin, and avoid exposing pending job data on arbitrary websites.
- Replace long JD query strings with a short-lived capture ID. Support local development and configured production origins.
- Support in-page saved/applied reminders on recognized job pages, with dismissal and explicit optional host permissions.
- Begin autofill with supported ATS adapters: Greenhouse, Lever, and Ashby. Map names, contact links, location, and approved answers; show what will be filled and handle unsupported fields explicitly.
- Never invent eligibility answers. File inputs, custom controls, cross-origin frames, CAPTCHA, and submission require platform-specific handling. Do not promise universal autofill.
- Submission stays a user action. Detect completion when supported, then ask whether to mark applied; do not infer successful submission from button clicks alone.
- Website URL capture uses validated public destinations, redirect limits, timeouts, and private-network blocking. For JavaScript-heavy/blocked pages, use the extension or paste-JD fallback.

## Approximately 300 companies: research and maintenance

Target 300 unique companies, using mutually exclusive primary buckets and overlapping tags:

| Primary bucket | Target |
| --- | ---: |
| MNCs and established product companies with India roles | 70 |
| Mid-size product/SaaS companies | 60 |
| Indian growth-stage startups | 70 |
| Emerging Indian startups with recent funding evidence | 50 |
| Recent YC companies with India or India-eligible remote opportunities | 50 |
| Total | 300 |

If too few qualifying companies exist in a bucket, document the shortfall and redistribute rather than pad with unsuitable entries. YC backing and recent funding are separate tags: neither proves an open role or a recent funding round.

For every published record store name, canonical domain, primary category, sector, official careers URL, resolved ATS URL if relevant, headquarters, hiring locations, India/remote eligibility evidence, relevant role families, YC batch/profile if applicable, funding round/date/source when verified, source URLs, verification outcome, and checked-at timestamp.

Research procedure:

1. Discover candidates from official company sites, YC directory/jobs, investor portfolio pages, and recent funding reporting.
2. Resolve careers links from the official domain or official YC profile. Never construct `/careers` guesses and label them verified.
3. Verify identity, redirect destination, and actual careers content. A successful HTTP response or generic landing page alone is insufficient. Record blocked/unknown/dead states honestly.
4. Confirm hiring geography separately from headquarters. Global remote does not establish that India applicants are eligible.
5. Define recently funded as a verified funding announcement in the last 180 days, with configurable 30/90/180-day filters. Recent YC batch is a separate filter.
6. Corroborate funding using company or investor announcements where available; preserve publication and event dates, currency, and source. Leave unknown amounts blank.
7. Deduplicate by canonical domain and company identity. Keep acquired/rebranded companies linked and annotate changes.
8. Deliver in researched batches of about 50 with a versioned JSON/CSV seed and import validation; completion means approximately 300 unique reviewed records, not 300 generated names.
9. Proposed maintenance: weekly link checks, monthly manual checks of blocked/stale entries, and periodic research for newly funded candidates. These are product jobs to implement, not automations created by this plan.

Filters: category, role family, seniority, city, India remote, sector, YC batch, funding recency, currently verified hiring, saved/applied, and last checked. Rank role/experience/geography fit ahead of funding recency. Capture explicit experience requirements and fresher/internship eligibility from live openings when available. Default recommendations to 0-YOE eligible roles; label unspecified eligibility as unknown and suppress explicitly senior-only openings from daily suggestions. A company's inclusion in the directory does not mean it currently hires freshers.

Initial source checks completed for this plan include the official YC India hiring directory and Razorpay's official careers page. This is not the completed 300-company dataset.

## Persistence and API boundaries

Add versioned migrations for `companies`, `company_sources`, `jobs`, `applications`, `application_events`, `resumes`, `resume_versions`, `outreach_drafts`, `email_connections`, `email_matches`, `daily_checkins`, `user_preferences`, and `extension_devices`. Add server-only credential storage and durable sync-job/checkpoint storage.

- All private records use user ownership and RLS. Composite ownership checks ensure another user's resume/job/application cannot be linked by guessing an ID.
- Unique `(user_id, local_date)` check-ins, `(connection_id, message_id)` email processing, and stable application/capture idempotency keys.
- Shared curated company data is readable but admin-written; personal saves/notes remain user-owned.
- Private Storage policies enforce ownership; signed downloads expire. Account deletion handles stored files and encrypted credentials.
- Route groups: applications/events; captures/lookup; resumes/versions; outreach/generate; companies/search; check-ins; integrations/gmail/connect/callback/sync/disconnect; extension/pair/revoke; settings/provider.
- Keep Next.js as the authenticated application API and FastAPI as the existing AI/document service. Put long-running mailbox/crawl/document work in a durable worker rather than a request that can time out.
- Add route validation, per-user limits, database error handling, and job observability without secrets or raw mailbox contents in logs.

## Delivery order and completion criteria

| Milestone | Deliverable | Verification |
| --- | --- | --- |
| 1. Application foundation | Migrations, shared navigation, Today, applications CRUD/timeline, 10-day filters, check-ins | Ownership isolation; duplicate prevention; timezone/midnight and reminder cases |
| 2. Role workspace and extension capture | Link existing Analyze/Customize/history; preserved job URLs; duplicate reminders | New/existing/same-company-different-role paths; origin checks; legacy links |
| 3. Resume library and outreach | Private uploads, versions, selected GitHub evidence, BYOK, edited DOCX export, saved cold emails | Original retained; unsupported claims rejected; document preview; exact version linkage |
| 4. Gmail manual synchronization | OAuth, encrypted credentials, bounded import, matching, classification, review inbox | Token expiry; multiple roles; ambiguous replies; duplicate/out-of-order events; manual override |
| 5. Background updates and autofill | Scheduler/worker, optional Pub/Sub, ATS adapters and fill preview | Authenticated webhook; retry/history recovery; unsupported field behavior; no auto-submit |
| 6. Company research release | Roughly 300 unique reviewed records and search/filter/import tools | Source-backed career destinations; funding/date evidence; eligibility and stale-link reporting |

Company research can begin alongside milestone 1, but the final directory must meet the same verification standards throughout. Release usable increments; the daily tracker should not depend on completing all 300 records.

First implementation slice: application/check-in migrations, Today + Applications views, shared application service, and linking the existing analysis/extension capture to application IDs.

## Configuration needed before integration rollout

- Actual Supabase schema and project access for applying reviewed migrations; private bucket and server credentials.
- Google Cloud OAuth client, Gmail API enabled, exact deployment callback URL, personal-use publishing configuration, and the user's Google consent. Pub/Sub and scheduler configuration follow when background sync is added.
- LLM provider/key supplied through the finished settings UI, server encryption secret, and deployment runtime configuration. Avoid placing personal keys in this plan or repository.
- Confirmed roles and 0-YOE target above allow UI/model work to begin. Preferred cities and daily application goal remain configurable; only show remote eligibility as confirmed when source evidence supports India applicants.

## Research references

- [Gmail scopes and restricted-data requirements](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google personal-use verification exceptions](https://support.google.com/cloud/answer/13464323?hl=en)
- [OAuth token expiration, including testing-mode behavior](https://developers.google.com/identity/protocols/oauth2)
- [Gmail push, watch renewal, and history processing](https://developers.google.com/workspace/gmail/api/guides/push)
- [Official YC companies hiring in India](https://www.ycombinator.com/companies/location/india/hiring)
- [Official YC jobs in India](https://www.ycombinator.com/jobs/role/all/india)
- [Official YC startup directory](https://www.ycombinator.com/companies)
- [Razorpay careers](https://razorpay.com/careers/)
