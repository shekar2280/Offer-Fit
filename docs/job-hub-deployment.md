# Job hub deployment and manual review

The new workspace is at `/hub`. The existing homepage remains the Analyze/Customize entry point until `NEXT_PUBLIC_JOB_HUB_ENABLED=true` is set at build time. The amber/navy theme and existing routes are preserved.

## Delivered code

- Today dashboard, daily IST check-in and streak, application tracker, status timeline, explicit applied dates, exact resume-version selection, and overdue follow-ups after more than ten days without substantive contact.
- Private PDF/DOCX/TXT/TEX originals, immutable resume text versions, editable Gemini tailoring drafts, controlled-template DOCX download, and saved cold/follow-up emails.
- Gemini user-key validation and encrypted storage; selected GitHub project evidence. Existing Analyze/Customize retain their current backend AI configuration.
- Separate Gmail read-only OAuth with PKCE and user-bound state; manual paginated sync; ambiguous match/reply review; atomic suggestion/checkpoint commits. Suggestions require review and do not automatically accept/reject an application.
- Optional opt-in background Gmail checks with a protected scheduler endpoint, database leases, retry checkpoints, and safe error reporting. The scheduler must be configured by the deployment owner.
- Extension 1.1: bounded job transfer, exact-URL duplicate reminders based on a manually synced snapshot, and user-requested contact autofill for Greenhouse/Lever/Ashby. No Gmail/API credentials are sent to the extension.
- Website URL capture reads public JobPosting metadata and fills reviewed role details. It validates/pins public IPv4 DNS destinations, rejects private networks and nonstandard ports, limits redirects and HTML size, and executes no remote scripts. Blocked/JavaScript-only/IPv6-only sites use the extension or pasted details.
- A 300-record careers directory with official source URLs, resolved destinations, timestamps, category filters, YC batches, and source-backed funding dates where available. This is a directory of career destinations, not 300 verified fresher vacancies.

## Staged rollout

1. Back up the production database and review the existing schema. Apply `supabase/migrations/202610080001_job_hub.sql` to a staging Supabase project first. This additive migration creates new hub tables, owner policies, server-only credentials, transaction functions, and a private Storage bucket. Do not re-run the ignored legacy setup script over production.
2. Configure staging environment variables using `frontend/.env.example`. Use a dedicated staging Google OAuth client and callback URL. Never copy production refresh tokens into staging.
3. Deploy a preview with `NEXT_PUBLIC_JOB_HUB_ENABLED=false`. Open `/hub` with your normal account and complete the manual checklist below. Existing resume flows stay available.
4. Once reviewed, apply the versioned migration to production, configure its secrets, and deploy. Verify `/hub` before turning on the homepage feature flag in a subsequent build.
5. Enable background sync only after its scheduler has been configured and verified. Let each user opt in independently.

The homepage now uses a unified Overview with shared workspace navigation. `NEXT_PUBLIC_JOB_HUB_ENABLED` enables its application summaries rather than replacing the homepage with Job Hub. The dedicated `/hub` remains accessible with either flag value. See `docs/portfolio-project-roadmap.md` for the delivery milestones and `supabase/verify_job_hub.sql` for read-only schema checks.

No production database migration, hosting configuration, deployment, or real Google consent was performed by the coding agent.

## Server configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing browser/auth configuration |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only credentials and tightly user-scoped worker operations |
| `OFFERFIT_APP_URL` | Exact application origin, e.g. `https://offerfit.vercel.app`; used for CSRF checks and OAuth callbacks |
| `OFFERFIT_ENCRYPTION_KEY` | Secret 32-byte random key encoded as base64; AES-256-GCM credential encryption |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google web OAuth client with Gmail API enabled |
| `OFFERFIT_GEMINI_MODEL` | Model used by the new BYOK drafting service; defaults to `gemini-3.8-flash` |
| `NEXT_PUBLIC_JOB_HUB_ENABLED` | Build-time homepage rollout flag; defaults to false |
| `OFFERFIT_BACKGROUND_SYNC_ENABLED`, `CRON_SECRET` | Explicit scheduler activation and a high-entropy server-only bearer secret |
| `BACKEND_URL`, `BACKEND_API_KEY` | Existing deployed AI/project service, now accessed through the authenticated project proxy |

Use a deployment secret manager. Do not put keys in source files, URLs, logs, browser storage, screenshots, or `NEXT_PUBLIC_` variables. User Gemini keys are entered in the finished Settings form rather than pasted into environment files.

Back up the encryption key securely alongside encrypted database backups. Replacing it without a re-encryption migration makes existing credentials unreadable; reconnect integrations if the original key is lost. Encryption binds each envelope to its user and integration type.

The new BYOK service defaults to a current Flash model. Google's [model lifecycle guidance](https://ai.google.dev/gemini-api/docs/deprecations) restricts 2.5 access to existing users and recommends newer models for new projects. Existing backend model configuration remains separate; confirm its access when deploying.

## Gmail setup

Enable the Gmail API in Google Cloud, configure OAuth consent, and register the exact redirect:

`https://YOUR-APP-ORIGIN/api/hub/gmail/callback`

For local development use the actual port. `OFFERFIT_APP_URL` must match it. The extension defaults to the production OfferFit origin and localhost port 3000; update its explicit trusted origin list if your deployment uses another domain.

The app requests `gmail.readonly`, never send/delete permission. Google classifies it as a restricted scope. Personal-use exceptions and public-app verification requirements differ. Testing-mode refresh tokens normally expire after seven days for Gmail scopes; configure publishing appropriately and expect reconnects after revocation/expiry. Review Google's requirements before distributing Gmail access publicly:

- [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Personal-use verification exceptions](https://support.google.com/cloud/answer/13464323?hl=en)
- [OAuth token expiration](https://developers.google.com/identity/protocols/oauth2)

Each sync examines up to 25 candidate messages per batch from the last 90 days. Search is limited to recruiting-related subject terms, so messages with unusual subjects may be missed. Company/role matches and snippet classification are suggestions. Multiple roles at one company, forwarded mail, vague subjects, and snippets lacking context require manual review. No-response reminders must not be treated as proof of rejection.

## Optional scheduler

Configure your hosting scheduler to call:

`GET /api/hub/gmail/cron` with `Authorization: Bearer <CRON_SECRET>`.

Suggested frequency: every 15 minutes. A connection is normally eligible once an hour; additional pages become eligible after 15 minutes. Each invocation leases up to three opted-in mailboxes. Expired five-minute leases recover interrupted runs. Failed runs retry after an hour; errors remain visible in Settings. Suggestions and the mailbox checkpoint commit in one database transaction, conditional on the original credential version, so stale workers cannot recreate a disconnected connection.

This endpoint requests up to 300 seconds of execution time. Use a hosting plan/runtime that supports it or move the worker to a durable job runner. Do not enable the switch if the hosting scheduler has not actually been installed. For many users, increase worker throughput deliberately and replace the simple scheduler loop with a managed queue. No Pub/Sub near-real-time watch integration is enabled in this release.

## Extension setup

Load `extension/` as an unpacked extension for your personal review, or package it through the normal extension distribution process. Do not install it into other people's browsers automatically.

In `/hub?view=settings`, choose **Sync profile & applications**. The extension caches contact fields and a compact company/role/status/URL snapshot locally. It receives no account-wide tokens. Reminders are based on that snapshot and expire after seven days; sync again after changing statuses. Clear local extension data when sharing a device. Signing out on OfferFit requests removal of the synced snapshot.

Recognized ATS pages show an existing-application reminder for exact normalized role URLs. The popup can transfer a new job into the hub or the existing Analyze/Customize flows. Arbitrary company websites can still be captured by invoking the extension popup: it injects the scraper only into the currently active tab on your request.

Contact autofill fills only empty, visible text/email/tel/URL controls with exact recognized labels on supported ATS domains. Eligibility questions, custom widgets, file upload, CAPTCHA, and final submission remain manual. Review every populated field.

## Privacy and security boundaries

- Private tables and Storage are isolated by authenticated user ID; cross-user resume/application references have composite foreign keys.
- Credentials and mailbox job leases have no browser access. Worker RPCs are executable only by the service role. Status/check-in functions derive the user from the session rather than a request-supplied ID.
- Resume versions are immutable; status events are client-read-only; Gmail evidence is server-written. Application edits check a revision number to avoid overwriting another tab.
- Requests have origin checks, text/JSON limits, bounded file sizes, PDF page limits, and DOCX ZIP/XML limits. The DOCX reader does not resolve external entities or read referenced files.
- Email bodies are not sent to Gemini. Only selected resume/job/profile/project evidence is sent by generation actions. Email snippets are stored as private review evidence.
- Generated text is a draft requiring human review. It is not a guarantee that every claim is true. DOCX output uses a controlled layout rather than preserving arbitrary Word formatting. PDF export is not implemented.
- Account deletion revokes Gmail, purges hub credentials/data, and removes private resume objects before invoking the existing account deletion function. Existing profile/analysis recovery behavior is preserved and described in the confirmation UI.
- Security headers block embedding, MIME sniffing, and object embeds. A full nonce-based script CSP is not claimed; it would require a separate deployment-specific rollout.
- The production benchmark authentication bypass is disabled. Real API routes still validate their own users.

## Your manual checklist

- Confirm existing login, Analyze, Customize, History, Profile, and GitHub sync still work against staging services.
- Save two different roles at one company. Reopen an exact role URL and confirm it identifies the correct application.
- Change status in two tabs and confirm a stale revision is rejected. Verify no silence-based rejection occurs.
- Check in twice on the same IST date and review the counter/streak across midnight.
- Upload representative DOCX/PDF/TEX resumes, preview extraction, download the original, and inspect the generated DOCX layout. Check a scanned PDF's empty-text error.
- Save a Gemini key, generate/edit an email and a resume draft with selected projects, save versions, and record a sent date only after actually sending.
- Connect your staging Gmail account. Review acknowledgements, assessments, interviews, offers, rejections, unknown replies, and ambiguous matches. Confirm manual changes prevent older replies from regressing status.
- Verify disconnect while a sync is in progress, expired OAuth credentials, and scheduler retries using staging accounts only.
- Review the 300-company filters, YC 2026 signal, funding dates, mobile navigation, empty states, and modal keyboard behavior.
- Review the extension's profile preview, duplicate reminders, transfer expiry, contact fields, and supported/unsupported pages.

The local sample preview at `/dev-preview` is available only with development mode and `OFFERFIT_PREVIEW_ENABLED=true`; writes are disabled. Production requests return 404.

## Developer checks

From `frontend/`: `npm run test:hub`, `npx tsc --noEmit`, scoped ESLint, `npm run build`, and `npm audit --omit=dev`. The embedded PostgreSQL suite models Supabase auth/storage policies without connecting to production. It is not a substitute for hosted OAuth or full manual app review.

The reviewed frontend runtime dependency tree reports zero known advisories. The full development/build tool tree still reports ten advisories, mostly in legacy Tailwind/ESLint glob/selector dependencies. Do not force an incompatible Tailwind downgrade/upgrade without a dedicated theme migration. Run builds in isolated CI and revisit those upstream fixes. This audit does not certify the separately deployed Python service or its installed dependencies.

Career source maintenance: run `node scripts/research-companies.mjs collect`, then `node scripts/verify-careers.mjs`. Funding enrichment is a reviewed source-backed file, not an automated freshness claim. `frontend/data/company-link-review.json` retains excluded/blocked candidates for later review. Check records again periodically; job availability and links change.
