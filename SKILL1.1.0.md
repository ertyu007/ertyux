---
name: portfolio-production-hardening
version: 1.1.0
description: >-
  Systematically audit, repair, secure, test, and production-harden the 3D Next.js
  portfolio in this repository. Use this skill for broad error correction,
  architecture stabilization, Supabase/admin security, React correctness,
  accessibility, performance, and release readiness. Work as a principal-level
  engineer: inspect before changing, make evidence-based patches, test every phase,
  and never perform speculative or shotgun rewrites.
---

# Portfolio Production Hardening Skill

## 1. Mission

Act as a principal software engineer responsible for making this repository secure,
correct, maintainable, accessible, performant, and production-ready without damaging
its intended 3D portfolio experience.

The repository is a Next.js App Router project using technologies that include:

- Next.js and React with Server Components and Client Components
- TypeScript
- Supabase database and storage
- A custom admin dashboard and Server Actions
- React Three Fiber, Three.js, and Drei
- GSAP and ScrollTrigger
- Framer Motion
- `next-themes`
- EmailJS
- Neumorphic/glass visual styling

This is not a license to rewrite the application from scratch. Preserve the product's
identity, visual direction, public URLs, data model, and user-visible behavior unless a
change is required to correct a verified defect, security issue, accessibility problem,
or production blocker.

Communicate with the user in the language used by the user. Use English for source-code
identifiers, types, tests, commit-style summaries, and technical filenames unless the
existing repository consistently uses another convention.

---

## 2. Repository Context

Expected application paths from the supplied repository structure:

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   ├── page.tsx
│   └── admin/
│       ├── actions.ts
│       ├── AdminClient.tsx
│       ├── AdminWrapper.tsx
│       ├── ClientRedirect.tsx
│       ├── LoginForm.tsx
│       └── page.tsx
├── components/
│   ├── About.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   ├── FrameSequence.tsx
│   ├── Hero.tsx
│   ├── MagneticButton.tsx
│   ├── Navigation.tsx
│   ├── Projects.tsx
│   ├── ScrollExperience.tsx
│   ├── Services.tsx
│   └── ThemeProvider.tsx
└── lib/
    ├── supabase-admin.ts
    └── supabase.ts
```

Other important files may include:

```text
.env.local
.env.example
package.json
package-lock.json
next.config.mjs
tsconfig.json
eslint.config.mjs
README.md
seed-db.mjs
test-db.mjs
Supabase SQL migrations, schema definitions, RLS policies, and RPC functions
```

Verify all real paths before editing. Do not rely only on this expected layout.

---

## 3. Non-Negotiable Engineering Rules

### 3.1 Inspect before editing

Do not write code during the first pass. First inspect:

1. `package.json` and lockfile
2. `tsconfig.json`
3. Next.js configuration
4. ESLint configuration
5. all environment-variable usage
6. Supabase client initialization
7. database schema, RLS policies, storage policies, and RPC definitions
8. route and component boundaries
9. current scripts and test infrastructure
10. Git status and existing uncommitted work

Never assume a library version, API shape, schema column, deployment platform, runtime,
or authentication provider without evidence from the repository.

### 3.2 Fail closed

Security-sensitive code must deny access when configuration is absent, invalid,
expired, or unverifiable. Missing environment variables must never accidentally grant
admin access.

### 3.3 Never store a password in a session cookie

A session cookie must contain an opaque or cryptographically signed session value, not
the administrator's plaintext password, password hash, service-role key, or reusable
credential.

### 3.4 Never trust client input

Every Server Action, route handler, RPC call, upload, ID, URL, and form field must be
validated on the server. HTML input attributes such as `required`, `type="url"`, and
`accept="image/*"` are not security controls.

### 3.5 No silent failures

Forbidden patterns include:

```ts
catch {}
catch { /* ignore */ }
```

Errors must be handled intentionally. User-facing failures need safe feedback;
server-side failures need structured logging without leaking secrets.

### 3.6 No shotgun debugging

Do not:

- rewrite entire files to fix a local issue
- change multiple unrelated subsystems in one patch
- add dependencies without checking whether existing tools already solve the problem
- replace the authentication architecture without first auditing the current setup
- suppress TypeScript or ESLint errors to make builds appear green
- use `any`, `@ts-ignore`, `@ts-nocheck`, or broad eslint-disable comments as shortcuts
- remove 3D, animations, projects, or admin features merely to improve a score
- fabricate portfolio content, metrics, social URLs, project links, or credentials
- edit `.env.local` with invented values
- expose secrets through `NEXT_PUBLIC_*`, logs, browser bundles, error messages, or reports

### 3.7 Preserve behavior and design

Unless required by a defect:

- retain light/dark theme behavior
- retain the visual design language
- retain section anchors and public navigation behavior
- retain the 3D scroll experience with an accessible reduced-motion fallback
- retain project CRUD capability
- retain project likes and sharing, while making them correct and abuse-resistant

### 3.8 Small, reversible changes

Make cohesive patches by phase. After each phase:

1. inspect the diff
2. run relevant checks
3. record results
4. revert or repair partial changes when checks fail

Do not continue building on a broken baseline unless the failure is documented and the
next patch directly addresses it.

---

## 4. Required Work Products

Create or update these reports in a repository-local agent report directory, for
example `.antigravity/reports/`, unless the repository already has an established
location:

```text
.antigravity/reports/
├── 00-baseline.md
├── 01-audit-register.md
├── 02-execution-plan.md
├── 03-test-report.md
└── 04-release-summary.md
```

Do not commit secrets, raw environment values, cookies, database keys, or personal data
to these reports.

### `00-baseline.md`

Record:

- current branch and Git status
- Node and package-manager versions
- framework and critical dependency versions
- available npm scripts
- baseline results for install, lint, type-check, tests, and build
- existing warnings and errors exactly enough to reproduce them
- unavailable checks and the reason they could not be run

### `01-audit-register.md`

Use a table with:

| ID | Severity | Area | Evidence | Risk | Proposed fix | Status |
|---|---|---|---|---|---|---|

Severity definitions:

- **P0 Critical:** authentication bypass, secret exposure, unauthorized privileged
  action, destructive data risk, remote-code or storage abuse
- **P1 High:** broken core behavior, serious data inconsistency, production crash,
  major accessibility barrier, severe performance regression
- **P2 Medium:** maintainability problem, incomplete error handling, SEO issue,
  responsive defect, moderate performance issue
- **P3 Low:** cleanup, consistency, dead code, documentation, minor polish

### `02-execution-plan.md`

For every phase record:

- files expected to change
- dependencies or schema implications
- migration and rollback plan
- exact verification commands
- manual checks
- stop conditions

### `03-test-report.md`

Record actual command output summaries and manual test results. Never mark a check as
passed if it was not run.

### `04-release-summary.md`

Include:

- issues fixed by severity
- changed files
- migrations or environment changes required
- residual risks
- deployment steps
- rollback steps
- checks that still require human credentials or production access

---

## 5. Mandatory Phase Workflow

## Phase 0 — Repository Discovery and Baseline

Perform these actions before modifying source code:

1. Read repository guidance files such as `AGENTS.md`, `CLAUDE.md`, and `README.md`.
2. Run `git status --short` and preserve all existing user changes.
3. Determine the package manager from the lockfile.
4. Inspect `package.json` scripts and dependency versions.
5. Inspect `next.config.*`, `tsconfig.json`, and ESLint configuration.
6. Locate all references to:
   - `ADMIN_PASSWORD`
   - `admin_session`
   - Supabase URL, anon key, and service-role key
   - `supabaseAdmin`
   - project insert/update/delete operations
   - storage bucket `portfolio`
   - RPC `increment_likes`
   - EmailJS credentials
   - `dangerouslySetInnerHTML`
   - `catch {}`
   - `any`
   - `window.location.reload()`
   - `frameloop="demand"`
   - GSAP `ScrollTrigger`
7. Inspect database migrations, RLS, storage policies, and RPC security.
8. Run the repository's existing verification scripts.

Use the real scripts found in `package.json`. When equivalents exist, the baseline
should cover:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Do not invent scripts. If `typecheck` or `test` is absent, record that fact. You may run
`npx tsc --noEmit` only after confirming it is compatible with the repository.

Stop and report before destructive changes if the working tree contains user changes
that would be overwritten.

---

## Phase 1 — Critical Authentication and Authorization

Treat this phase as P0.

### 5.1 Verify and replace unsafe admin session behavior

Known risk to verify in `src/app/admin/actions.ts` and `src/app/admin/page.tsx`:

- login compares a submitted password directly with `process.env.ADMIN_PASSWORD`
- the password itself is placed in the `admin_session` cookie
- the admin page compares the cookie value with the environment password
- missing `ADMIN_PASSWORD` may produce an unsafe equality condition
- privileged Server Actions do not independently verify admin authorization

Required outcome:

1. Environment configuration is validated in a server-only module.
2. Missing or malformed admin configuration fails closed.
3. The browser never receives the admin password or a reusable secret.
4. Session verification is cryptographic or delegated to an established auth provider.
5. Every privileged Server Action calls a shared authorization guard before touching
   Supabase admin APIs.
6. Session cookies use deliberate attributes:
   - `httpOnly: true`
   - `secure: true` in production
   - an appropriate `sameSite` value
   - `path: "/"`
   - explicit expiration or max age
7. Logout deletes the same cookie path and compatible attributes.
8. Session tampering and expiration are rejected.

Preferred decision order:

1. If Supabase Auth is already configured for admin access, use it correctly and verify
   authorization server-side.
2. If an existing authentication library is present, use its supported session model.
3. Otherwise implement a minimal cryptographically signed or opaque server-validated
   session using platform-supported cryptography.

Do not add a large authentication framework solely to avoid understanding the current
application.

When comparing secret material, use a constant-time comparison where practical. Never
log submitted passwords, expected passwords, session tokens, or hashes.

### 5.2 Add a single shared `requireAdmin()` boundary

Create one server-only authorization function and call it at the beginning of:

- create project
- update project
- delete project
- any future privileged storage or database operation

The guard should return a typed authenticated context or throw/return a controlled
unauthorized result. Do not duplicate cookie-validation logic across files.

### 5.3 Login abuse protection

Inspect the deployment environment before choosing rate limiting.

Required behavior:

- reject rapid repeated failures
- avoid unbounded in-memory maps in production serverless runtimes
- use a persistent or platform-supported rate limiter when the project already has one
- document any infrastructure required
- show a generic login error without revealing whether configuration or credentials are
  wrong

An in-memory limiter may be acceptable only as a clearly documented local-development
fallback. Do not falsely present it as production protection.

### 5.4 CSRF and origin considerations

Confirm how Next.js Server Actions and deployment origin checks are configured. Do not
add redundant custom CSRF logic without understanding framework protections, but ensure
privileged mutations cannot be triggered from an untrusted origin or without a valid
admin session.

### Phase 1 acceptance criteria

- no plaintext admin password in cookies
- no authorization through direct cookie/password equality
- missing env configuration denies access
- all privileged actions verify authorization internally
- tampered and expired sessions fail
- wrong passwords are rate-limited
- secrets are absent from browser bundles and logs
- lint, type-check, authentication tests, and build pass

---

## Phase 2 — Server Action Validation and Storage Integrity

Treat authorization and validation as separate requirements. An authenticated admin can
still submit malformed or dangerous input.

### 5.5 Validate all project fields server-side

Validate and normalize at least:

- project ID according to the real schema, commonly UUID
- title: trim, required, sensible minimum/maximum length
- description: trim, required, sensible maximum length
- demo link: empty or valid `http:`/`https:` URL only
- GitHub link: empty or valid `http:`/`https:` URL only
- uploaded file presence according to create/update rules

Reject dangerous URL schemes such as `javascript:`, `data:`, and unsupported protocols.
Do not silently transform invalid values into valid-looking data.

Use a validation library only if it already exists or its addition is justified. A
small typed validator is preferable to an unnecessary dependency.

Return structured, discriminated action results, for example conceptually:

```ts
{ ok: true, data: ... }
{ ok: false, code: "VALIDATION_ERROR", fieldErrors: ..., message: ... }
```

Do not expose raw database internals to the browser.

### 5.6 Harden image upload

Verify storage policy and then enforce on the server:

- MIME allowlist, such as JPEG, PNG, WebP, and AVIF only when supported
- maximum file size appropriate for the site
- non-empty file
- safe random object name, preferably `crypto.randomUUID()`
- no trust in the original extension
- explicit `contentType`
- `upsert: false`
- optional magic-byte validation when feasible
- image dimension or decompression-bomb protection when an image-processing pipeline
  exists

Do not create public URLs for unsupported content.

### 5.7 Prevent orphaned storage objects

Current behavior must be audited for these failure paths:

1. upload succeeds but database insert fails
2. replacement upload succeeds but database update fails
3. update succeeds but old image remains in storage
4. project delete succeeds but its image remains in storage
5. storage delete fails after database mutation

Implement compensating cleanup because database and object storage are not one atomic
transaction.

Preferred data model:

- store an `image_path` or storage object key in addition to or instead of only a public
  URL
- derive the public URL at presentation time where practical
- never parse arbitrary public URLs to guess a storage path unless the format is fully
  controlled and tested

If a schema migration is required:

1. create an explicit migration
2. make it backward-compatible when possible
3. backfill safely
4. document deployment order
5. provide rollback notes

Do not delete an old image until the new database state is confirmed. For project
deletion, choose and document whether storage or database deletion occurs first and how
partial failure is recovered.

### 5.8 Database correctness

- inspect insert/update/delete return values and affected-row counts
- distinguish not-found from database failure
- avoid broad `.select("*")` when a typed field list is sufficient
- handle query errors in admin page data loading
- generate or maintain Supabase database types when the project supports it
- verify service-role clients are imported only into server-only modules
- verify anon clients operate under correct RLS policies

### Phase 2 acceptance criteria

- malformed fields are rejected server-side
- unsupported and oversized files are rejected
- filenames are generated safely
- failed DB writes clean up newly uploaded objects
- image replacement and deletion do not leak known storage objects
- errors are typed and safe
- tests cover success and partial-failure paths

---

## Phase 3 — Admin Dashboard Correctness

Known files:

- `src/app/admin/AdminClient.tsx`
- `src/app/admin/LoginForm.tsx`
- `src/app/admin/AdminWrapper.tsx`
- `src/app/admin/ClientRedirect.tsx`
- `src/app/admin/page.tsx`

### 5.9 Correct stale-state submit logic

Known defect to verify:

```ts
setLoading(false);
if (!loading) window.location.reload();
```

React state is asynchronous. Do not use a stale `loading` closure to decide success.
Use the actual Server Action result.

Required behavior:

- keep loading true through the request
- disable duplicate submissions
- on failure, preserve form data and show actionable feedback
- on success, close/reset the modal and refresh data using state reconciliation,
  `router.refresh()`, or returned server data
- do not force a full browser reload merely to synchronize CRUD data
- restore loading in `finally`

### 5.10 Correct delete behavior

Current delete behavior must not remove an item from local state unless the server
confirms success.

Required behavior:

- confirm intent using an accessible mechanism
- disable the specific row action while deleting
- check the structured action result
- update state with a functional setter
- show failure feedback without lying about deletion
- consider optimistic updates only with rollback

### 5.11 Type the admin data

Replace broad `any` usage with a real `Project` type derived from the database schema or
a shared application type. Type:

- `initialProjects`
- modal project input
- action results
- form state
- update payloads

Do not create conflicting duplicate Project types across unrelated files. Prefer a
shared server-safe type module when appropriate.

### 5.12 Theme-safe form controls

Remove hard-coded white input text when the light theme uses a light background. Use
design tokens for:

- input text
- placeholder text
- borders
- file input text
- focus state
- invalid state
- disabled state

Verify both light and dark modes manually.

### 5.13 Admin route layout

The root layout currently renders public navigation globally. Verify whether `/admin`
shows navigation whose hash links point to missing admin sections.

Preferred architecture:

- route groups or nested layouts separating the public site from admin UI
- admin page should not require hash-redirect workarounds
- remove duplicate redirect components only after confirming they are unused

Do not change public URLs unnecessarily.

### Phase 3 acceptance criteria

- save success and failure behave correctly
- no stale-state reload logic
- delete UI reflects the real server result
- forms work in both themes
- admin components have no unjustified `any`
- public navigation does not break admin routing
- keyboard and screen-reader behavior passes the accessibility checks in Phase 6

---

## Phase 3A — Admin Multi-Image Media Manager and Upload Experience

The admin project editor must become a deliberate media-management workflow, not a
default browser file input. It must support a maximum of five project images, clear
previews, drag-and-drop selection, ordering, cover selection, visible upload state,
recovery from partial failure, and accessible keyboard operation.

This phase is coupled to the public project gallery. Do not build an admin UI that stores
data the public viewer cannot consume, and do not build the public viewer around fields
the admin cannot maintain.

### 5.13.1 Establish the image data model before building UI

Inspect the real database schema, migrations, generated Supabase types, and existing
records before choosing a storage model. Prefer a normalized relation when the product
needs ordering and per-image metadata:

```text
projects
  id
  title
  description
  demo_link
  github_link
  likes_count
  ...

project_images
  id
  project_id
  storage_path
  public_url or derived URL policy
  sort_order
  is_cover
  width optional
  height optional
  alt_text optional
  created_at
```

Required invariants:

- zero to five images per project according to the final product rule
- exactly one cover image when at least one image exists
- no more than one cover image per project
- unique and deterministic `sort_order` within a project
- public display order matches admin order
- deleting a project has a defined image cleanup strategy
- old one-image records remain readable during migration

A `text[]` or JSON column may be acceptable only after documenting why a normalized table
is unnecessary. Do not choose JSON merely because it produces less code. Ordering,
cover selection, deletion, migrations, and referential cleanup must still be correct.

When a migration is needed:

1. add the new schema without immediately removing the legacy `image_url` field
2. backfill existing records into `project_images`
3. make readers temporarily support both formats if deployment ordering requires it
4. update the admin writer
5. update the public reader
6. verify production data
7. remove the legacy field only in a later, explicitly reviewed migration

Do not perform a destructive schema migration and UI rewrite in one unverified step.

### 5.13.2 Replace the raw file input with an accessible drop zone

Build a dedicated component such as `ProjectImageUploader` or `ProjectMediaManager`. The
visible drop zone must support:

- drag files over the zone
- drop one or multiple files
- click or press Enter/Space to open the native picker
- select additional files without discarding valid existing selections
- accept image files only
- reject selections that would exceed the five-image limit
- display remaining capacity, such as `3 of 5 images`
- remain usable with JavaScript accessibility tools and without drag-and-drop

The underlying `<input type="file" multiple>` must remain present and correctly labeled.
Do not create a mouse-only drop target.

Minimum accessibility behavior:

- semantic button or labeled input relationship
- visible focus ring
- concise instruction text
- `aria-describedby` for limits and accepted formats
- live-region announcement when files are added, rejected, uploaded, retried, or removed
- no essential instruction communicated only through color
- drag state must not trap pointer or keyboard focus

### 5.13.3 Provide restrained drag-and-drop visual feedback

The interaction may feel polished, but effects must communicate state rather than hide
functionality. Implement a small state-responsive treatment:

- idle: neutral dashed border and upload icon
- drag entered with acceptable files: subtle scale or lift, stronger border, soft glow
- drag entered with invalid files: error border and clear rejection text
- validating: small spinner with `Checking files…`
- limit reached: disabled add affordance with `Maximum 5 images`
- reduced-motion mode: remove scale/spring effects while preserving state changes

Do not:

- animate continuously while idle
- create aggressive neon effects that obscure text
- rely on an animated border as the only status indicator
- let drag events cause browser navigation to the dropped image

Prevent default behavior for the correct drag events and scope drag counters carefully so
the active state does not flicker when crossing child elements.

### 5.13.4 Generate immediate local previews safely

After client validation, show a preview card for every selected image before upload. Each
card must contain:

- actual image preview
- file name, truncated safely
- human-readable file size
- dimensions when available and useful
- order number
- cover badge or `Set as cover` control
- remove control
- status indicator

Use object URLs or another local preview method that does not upload files merely to show
a preview. Revoke every object URL when:

- its file is removed
- the form resets
- the modal closes
- the component unmounts
- the selected file is replaced by a server-backed image record

Avoid loading the full image into large base64 strings in React state. Keep `File`
objects out of serializable server data and maintain explicit client-only draft types.

Suggested typed model:

```ts
type ExistingProjectImage = {
  kind: "existing";
  id: string;
  storagePath: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
};

type NewProjectImage = {
  kind: "new";
  clientId: string;
  file: File;
  previewUrl: string;
  sortOrder: number;
  isCover: boolean;
  status: "ready" | "uploading" | "uploaded" | "error";
  progress: number | null;
  error?: string;
};
```

Adapt the exact shape to the repository, but preserve the distinction between persisted
and unsaved images.

### 5.13.5 Validate on both client and server

Client validation exists for immediate feedback only. Server validation is authoritative.
Enforce and test:

- maximum five final images after accounting for retained existing images
- allowed MIME types
- allowed file signatures when feasible
- maximum bytes per image
- non-empty files
- sensible pixel dimensions when image inspection is available
- no duplicate client entries from the same selection event
- safe generated storage paths
- no path or extension trust from the original filename

Display rejection per file rather than failing the whole selection without explanation.
For example:

```text
hero.psd — unsupported format
photo.png — 14.8 MB exceeds the 8 MB limit
cover.webp — accepted
```

Do not silently compress, crop, or discard a user's image unless that transformation is
an explicit, visible product feature.

### 5.13.6 Support ordering and cover selection

The admin must be able to determine what visitors see. Provide:

- drag-to-reorder thumbnails on pointer devices
- keyboard-accessible move-left and move-right controls
- a clear `Cover` badge
- a `Set as cover` action for every non-cover image
- deterministic fallback: the first ordered image becomes cover if the cover is removed

Use an established drag-sort package only if already installed or clearly justified. A
small, tested implementation is preferable to a large dependency for five items.

Animation requirements:

- use layout animation so thumbnails move to their new positions instead of jumping
- use a short removal animation before collapsing the slot
- do not let animation alter the committed ordering data
- disable complex motion under `prefers-reduced-motion`

Persist both order and cover state atomically enough that a refresh cannot produce two
cover images or ambiguous ordering.

### 5.13.7 Define the upload state machine explicitly

Do not represent the entire workflow with one ambiguous boolean named `loading`. Use
explicit states. A valid model may include:

```text
IDLE
EDITING
VALIDATING_FILES
READY_TO_SAVE
REQUESTING_UPLOAD_AUTHORIZATION
UPLOADING_FILES
SAVING_PROJECT
CLEANING_UP
SUCCESS
PARTIAL_FAILURE
ERROR
```

Per-file states may include:

```text
READY -> UPLOADING -> UPLOADED
                  -> ERROR -> RETRYING -> UPLOADED
```

Required UI behavior:

- Save is disabled while validation is running
- duplicate Save requests are impossible
- closing the modal while a mutation is active requires a deliberate decision or is
  temporarily disabled with an explanation
- unrelated admin rows remain usable when safe
- the active form remains visible until the entire operation reaches a known outcome
- success is shown only after storage and database work required by the workflow finish
- errors preserve title, description, links, selected files, ordering, and cover state

Do not set loading false before cleanup or final database reconciliation completes.

### 5.13.8 Show honest upload progress

The user requested loading feedback until upload is truly complete. Never display fake
numeric progress merely by incrementing a timer.

Use one of these verified strategies:

1. **Actual byte progress**
   - obtain a narrowly scoped signed upload target or equivalent server authorization
   - upload from the browser using a transport that exposes upload progress
   - never expose a service-role key
   - report per-file bytes and aggregate progress

2. **Indeterminate progress when actual bytes are unavailable**
   - display an animated progress indicator without a fabricated percentage
   - show the current operation, such as `Uploading image 2 of 4`
   - transition to `Saving project details…` when uploads are complete

If the current Server Action architecture cannot expose actual upload progress, do not
pretend it can. Either introduce a secure progress-capable upload architecture or use an
honest indeterminate state. Document the choice.

Recommended progress UI:

- aggregate bar at the top or bottom of the form
- per-image progress ring or thin bar on each thumbnail
- text such as `Uploading 2 of 5` and `63%` only when measured
- success check animation for each completed image
- explicit retry action for failed images
- preserve completed uploads during a retry when safe

Progress values must be monotonic for a single attempt and must not jump to 100% until
the corresponding upload call has actually completed.

### 5.13.9 Choose staged upload semantics deliberately

Default recommendation for this portfolio:

- dropping files creates local previews only
- files upload when the admin presses Save
- the project mutation completes only after all required uploads succeed
- closing an unsaved form discards local previews without creating storage objects

This minimizes orphaned files.

If product requirements demand immediate upload on drop, implement a draft-upload
protocol:

- create uploads under an isolated draft prefix
- associate them with a short-lived draft identifier
- finalize/move or reference them only after project Save succeeds
- delete drafts on cancel
- run scheduled cleanup for abandoned drafts

Do not immediately upload into the permanent project path and hope the user eventually
saves the form.

### 5.13.10 Handle create and edit workflows differently where necessary

Create mode:

- start with no persisted images
- require at least one image only if the product rule says so
- assign the first accepted image as cover by default
- rollback newly uploaded objects if project creation fails

Edit mode:

- load all existing images in persisted order
- allow new files up to a final total of five
- mark removed existing images as pending removal; do not delete immediately
- preserve the original database and storage state until the replacement mutation is
  confirmed
- after successful commit, remove superseded storage objects
- if cleanup fails, report and log a recoverable cleanup issue rather than lying about
  full success

When the admin replaces all images, never delete the old set before the new set and the
project relation are safely committed.

### 5.13.11 Make the modal resistant to accidental data loss

The editor must detect dirty state. When title, description, links, image selection,
order, cover, or removal state differs from the loaded project:

- backdrop click must not silently discard changes
- Escape must not silently discard changes
- close button should ask for confirmation when there are unsaved changes
- no confirmation is needed after successful save or when the form is unchanged

During upload/save:

- disable accidental backdrop close
- keep the progress UI visible
- explain why closing is unavailable or offer a tested cancellation path
- do not allow navigation that leaves unknown storage/database state

### 5.13.12 Add polished but purposeful micro-interactions

Allowed interactions include:

- thumbnail entry with a short fade/scale animation
- layout transition during reorder
- cover badge transition
- checkmark when an image finishes uploading
- gentle shake on a rejected file or failed upload
- success state that resolves into the refreshed admin record

Rules:

- no animation may block immediate error reading
- no status disappears before the user can understand it
- all controls remain usable during and after animation
- use the existing Framer Motion dependency rather than introducing a second animation
  system for the same UI
- obey reduced-motion preferences

### 5.13.13 Keep previews visually faithful

Use a consistent thumbnail frame in the admin while preserving the source image:

- preview may use `object-fit: cover` only inside clearly cropped thumbnails
- clicking a thumbnail should open a larger non-destructive preview using
  `object-fit: contain`
- never put gradients or text overlays across the image in the large preview
- show the original aspect ratio where practical
- do not imply that a thumbnail crop changes the uploaded file

The public app-style gallery and admin preview should share the same ordering and cover
semantics, but they do not need identical visual dimensions.

### 5.13.14 Error recovery and retry

Handle at least:

- one file rejected before upload
- one file upload fails while others succeed
- upload authorization fails
- all uploads succeed but database save fails
- database save succeeds but old-object cleanup fails
- user loses network connection during upload
- session expires during editing or upload
- project was modified or deleted elsewhere

Requirements:

- identify the failed file and operation
- offer retry where retry is safe
- do not re-upload already completed files unnecessarily
- do not duplicate project image rows on retry
- preserve idempotency through stable operation IDs or checked results where needed
- cleanup newly uploaded objects when the overall mutation cannot be committed
- never expose raw Supabase or storage secrets in the error message

### 5.13.15 Admin media-manager testing

Add tests at the appropriate level. Minimum scenarios:

1. click-to-select adds one preview
2. dropping multiple valid files adds previews in deterministic order
3. sixth image is rejected without removing the first five
4. invalid MIME and oversized files show per-file errors
5. removing a new preview revokes/discards it
6. removing an existing image marks it pending until save
7. reordering changes persisted `sort_order`
8. setting cover enforces exactly one cover
9. save cannot be submitted twice
10. upload progress remains visible until completion
11. measured percentage is shown only with real progress data
12. one failed upload can be retried
13. database failure cleans newly uploaded storage objects
14. edit failure preserves old images
15. canceling an unchanged form closes immediately
16. canceling a dirty form warns before discarding
17. keyboard users can add, remove, reorder, set cover, save, and cancel
18. reduced-motion mode removes nonessential motion
19. light and dark themes remain readable
20. object URLs are released on reset and unmount


### 5.13.16 Admin uploader visual and interaction contract

Treat the uploader as a first-class product surface. It must not look or behave like a
raw browser file field placed inside a modal.

Required visual structure:

1. **Drop zone header**
   - clear upload icon
   - primary instruction: `Drop images here`
   - secondary instruction: `or click to browse`
   - accepted formats and maximum size
   - live capacity label such as `2 / 5 images`

2. **Preview workspace**
   - render selected and existing images immediately as thumbnail cards
   - preserve source aspect ratio in a larger inspect view
   - make the cover image visually obvious
   - show order numbers
   - show file size and upload state without covering important image content
   - provide remove, retry, inspect, move, and set-cover actions

3. **Operation footer**
   - persistent aggregate progress while work is active
   - current phase text
   - Save and Cancel controls
   - clear success or recoverable error state

The drop zone must have purposeful motion:

- idle: still and readable
- valid drag enter: border brightens, icon rises slightly, surface scales no more than a
  few percent
- invalid drag enter: restrained error pulse and explicit text
- file accepted: preview animates into the workspace
- reorder: neighboring previews move through layout animation
- upload complete: the corresponding preview changes to a success check state
- upload failure: the failed preview receives a short, non-repeating shake and a visible
  Retry action
- complete save: the form resolves to a stable success state before refreshing or
  closing

Do not run looping decorative animation while no operation is happening.

### 5.13.17 Loading must cover the complete transaction

The user must never see `Saved` while images or database records are still pending.
Define the complete operation as:

```text
validate all fields
-> validate all image files
-> obtain secure upload authorization when required
-> upload every required new file
-> verify each upload result
-> save project fields
-> save image rows, order, and cover state
-> reconcile removed images
-> perform or queue safe storage cleanup
-> refresh authoritative project data
-> show success
```

The main loading state begins when Save is accepted and ends only after this sequence
reaches SUCCESS, PARTIAL_FAILURE, or ERROR.

During the active operation:

- disable repeated Save submissions
- replace the Save label with the exact current operation
- keep the modal and previews mounted
- disable destructive editing controls that would invalidate the active request
- prevent backdrop close and Escape close
- do not call `window.location.reload()` as a substitute for state reconciliation
- do not clear previews, filenames, order, or cover selection early
- do not report 100% while the database phase remains pending

Recommended phase labels:

```text
Checking images…
Preparing secure upload…
Uploading image 1 of 4…
Uploading image 2 of 4…
Saving project details…
Updating gallery order…
Cleaning up replaced images…
Done
```

When byte progress is available, calculate aggregate progress from actual uploaded bytes
across all pending files. When byte progress is not available, show an indeterminate
indicator plus the exact current phase. Never synthesize percentages using timers.

### 5.13.18 Per-image status presentation

Every image preview must expose one explicit status:

```text
LOCAL_PREVIEW
VALIDATING
READY
UPLOADING
UPLOADED
PENDING_REMOVAL
FAILED
```

Presentation requirements:

- `LOCAL_PREVIEW` / `READY`: normal preview with available edit actions
- `VALIDATING`: subtle spinner and disabled commit for that image
- `UPLOADING`: real progress bar or indeterminate overlay limited to a small status area;
  never cover the entire image with opaque content
- `UPLOADED`: success check with filename still visible
- `PENDING_REMOVAL`: dimmed preview with Undo action until commit
- `FAILED`: concise error, Retry, and Remove actions

The status region should sit below the image or in a small edge-aligned badge. Do not put
large gradients, paragraphs, or controls across the center of the preview.

### 5.13.19 Preview and inspect behavior

The admin must be able to confirm image quality before saving:

- click or keyboard-activate any thumbnail to open a larger preview
- use `object-fit: contain` in the inspect view
- do not crop or place text over the inspected image
- show next/previous controls when more than one image exists
- show `current / total`, for example `3 / 5`
- Escape closes only the inspect view when no mutation is active
- focus returns to the originating thumbnail
- inspect view supports reduced motion and keyboard navigation

The inspect transition may use a shared `layoutId` so the thumbnail expands into the
preview and collapses back, matching the public app-style gallery interaction. The data
state must remain independent from animation state.

### 5.13.20 Retry, cancellation, and connection loss

When an upload fails:

- retain successful uploads and their identifiers when safe
- show which image failed
- allow retry of only the failed image
- prevent duplicate storage objects and duplicate database rows
- keep the form data intact

If true cancellation is implemented, cancellation must be connected to an actual
abortable request. A button that only hides the modal is not cancellation.

When cancellation is not safely supported:

- keep the modal open
- state that the upload is finishing
- allow the user to continue after the operation resolves

On network loss:

- transition active files to a recoverable failed/offline state
- preserve local previews
- show Retry when the connection returns
- do not silently restart uploads without user-visible state

### 5.13.21 Concrete admin component boundaries

Prefer explicit component boundaries such as:

```text
ProjectEditorDialog
  ProjectFields
  ProjectImageUploader
    ImageDropZone
    ImagePreviewGrid
      ImagePreviewCard
    ImageInspectDialog
    UploadProgressSummary
  ProjectEditorActions
```

Keep upload orchestration in a dedicated typed hook or controller, for example:

```text
useProjectImageManager
useProjectEditorMutation
```

Do not put file validation, object URL lifecycle, upload transport, database mutation,
modal animation, and all JSX into one oversized `AdminClient.tsx` component.

The controller must expose typed commands and derived state rather than many unrelated
booleans. Example responsibilities:

- add files
- reject files with reasons
- remove or undo removal
- reorder
- set cover
- inspect selected image
- upload pending files
- retry failed file
- commit project mutation
- cleanup previews

### 5.13.22 Additional acceptance scenarios for the polished uploader

Add or verify these scenarios in addition to the prior Phase 3A tests:

1. valid drag enter changes visual state without flicker across child elements
2. invalid drag enter communicates the reason without relying only on color
3. the preview appears before any network upload begins
4. large inspect view never has title, gradient, or controls covering the image center
5. Save label follows the actual active phase
6. aggregate loading remains active after file upload while database save is pending
7. the dialog cannot close accidentally during an active transaction
8. a failed file can retry without re-uploading completed files
9. pending deletion can be undone before Save
10. success is announced and displayed before the editor closes or refreshes
11. object URLs are released after successful replacement by persisted URLs
12. all states remain readable in light and dark themes
13. keyboard and screen-reader users receive equivalent upload state information
14. reduced-motion mode keeps every state transition understandable without scale or
    spring animation

### Phase 3A acceptance criteria

- admin can manage zero to five images according to the chosen product rule
- drag-and-drop and native file picker both work
- every selected image has an immediate preview
- existing and new images can be reordered together
- exactly one cover image is maintained
- the admin sees honest progress until upload and save complete
- failed files are identifiable and retryable
- closing the form cannot silently lose work or leave unknown mutations
- server-side file validation remains authoritative
- storage cleanup covers create, edit, replacement, cancellation, and failure paths
- the public gallery reads the same order and cover state written by the admin
- accessibility, reduced motion, lint, type-check, tests, and production build pass

---

## Phase 4 — Public Project Data and Interaction Correctness

Known file: `src/components/Projects.tsx`.

### 5.14 Separate empty state from failure state

Current logic must not display fabricated mock projects in production merely because:

- the database is empty
- a query fails
- a network request fails

Required behavior:

- production empty data -> explicit empty state
- production error -> safe error state with retry where useful
- development demo data -> only behind an explicit development/demo condition
- never misrepresent mock projects as real portfolio content

### 5.15 Prefer server data for initial rendering

Evaluate moving initial project fetching to a Server Component or the page layer, then
passing typed data to a Client Component for likes, modal, and sharing.

Benefits to target:

- useful initial HTML
- fewer client waterfalls
- clearer error handling
- improved SEO
- reduced loading flicker

Do not force this architecture if it conflicts with verified constraints, but document
the reason if retained client-only.

### 5.16 Handle missing or invalid images

The admin flow may create a project with an empty image URL. `next/image` must not be
called with an invalid source.

Implement one verified policy:

- require an image on create, or
- provide a local placeholder, or
- render an accessible no-image state

Also configure allowed remote image hosts in `next.config.*` based on real sources.
Do not add broad wildcard hosts without need.

### 5.17 Fix like consistency

Known risks to verify:

- optimistic local count changes before RPC confirmation
- empty catch blocks
- modal `selectedProject` count can become stale while list state changes
- in-memory `liked` set resets on reload
- RPC may permit unauthenticated unlimited increments

Required behavior:

1. Use a single source of truth for the selected project.
2. Roll back an optimistic like if the RPC fails.
3. Show safe failure feedback.
4. Prevent accidental duplicate clicks in the current UI.
5. Audit the RPC definition, execution privileges, search path, and RLS implications.
6. Define an abuse-control strategy appropriate to the product.

Do not claim that an in-memory Set prevents abuse. It only improves local UX.

### 5.18 Harden sharing and external links

- handle `navigator.share` cancellation separately from actual failure
- handle clipboard permission or API failure
- do not treat `"#"` as a valid project URL
- do not render external action links when a real URL is absent
- use `target="_blank"` with appropriate `rel`
- validate protocols before values enter the database

### 5.19 Remove unsafe or unnecessary style injection

Audit `dangerouslySetInnerHTML` used for static CSS. Prefer existing global CSS, CSS
Modules, or component-scoped supported styling. Never use this pattern for dynamic or
user-controlled content.

### Phase 4 acceptance criteria

- real empty and error states exist
- no production mock-data substitution
- invalid images cannot crash rendering
- likes stay synchronized and roll back on failure
- sharing failures are handled
- invalid links are not presented as actions
- project data appears in initial HTML when architecture permits

---

## Phase 5 — 3D, Animation, and Runtime Performance

Known files:

- `src/components/ScrollExperience.tsx`
- `src/components/Hero.tsx`
- `src/components/FrameSequence.tsx`
- `src/components/MagneticButton.tsx`

### 5.20 Fix render-loop correctness

Known condition to verify:

- the canvas uses `frameloop="demand"`
- GSAP updates a mutable scroll progress ref
- the render loop may not be invalidated when scroll progress changes

Choose one evidence-based solution:

- call React Three Fiber `invalidate()` when ScrollTrigger changes progress, or
- use `frameloop="always"` only when justified by continuous animation needs

Measure the tradeoff. Do not blindly switch to a permanent render loop on all devices.

### 5.21 Clean up GSAP and browser listeners

Every timeline, ScrollTrigger, resize listener, animation frame, timer, and observer
must be cleaned up.

Preferred approach:

- `useGSAP()` or `gsap.context()` scoped to the component
- `context.revert()` during cleanup
- remove event listeners
- cancel animation frames and timeouts
- avoid duplicate plugin registration behavior during hot reload and strict mode

Verify mount/unmount and route navigation do not create duplicate pin spacers or
triggers.

### 5.22 Adapt quality to device capability

Audit GPU and memory cost of:

- transmission materials
- geometry segment counts
- Sparkles/particle count
- environment maps
- shadows
- canvas DPR
- full-height pinned scenes

Implement measured safeguards:

- cap DPR, commonly around `[1, 1.5]` unless evidence supports more
- lower complexity on small screens or low-power devices
- avoid unnecessary transparent overdraw
- lazy-load heavy 3D bundles when practical
- provide a static or lightweight fallback if WebGL is unavailable
- use an error boundary for 3D runtime failure

Do not remove the 3D experience as the first optimization.

### 5.23 Respect reduced motion

Use `prefers-reduced-motion` and/or Framer Motion's reduced-motion support.

Reduced-motion behavior should:

- avoid long pinned motion sequences
- avoid large camera fly-throughs
- avoid continuous magnetic or floating movement
- retain all content and navigation
- show a stable visual fallback

### 5.24 Mobile viewport and responsiveness

Review `100vh` usage. Use modern viewport units such as `svh` or `dvh` where they solve
mobile browser chrome issues, with appropriate fallback.

Verify:

- 320px-wide viewport
- 375px-wide viewport
- tablet portrait and landscape
- desktop
- browser zoom at 200%

### 5.25 Avoid duplicate experiences and dead weight

`Hero.tsx`, `ScrollExperience.tsx`, and `FrameSequence.tsx` may overlap. Build an import
and usage graph before removing anything.

Only delete a component when:

- it is proven unused
- its assets are not used by scripts or future routes
- build and tests pass after removal
- the deletion is recorded in the audit

### Phase 5 acceptance criteria

- scrolling reliably updates 3D state
- no duplicated ScrollTriggers after remount
- no leaked listeners or animation frames
- reduced-motion users receive complete content
- 3D failures degrade gracefully
- mobile does not render unnecessarily expensive quality settings
- build output and bundle impact are reviewed

---

## Phase 6 — Accessibility and Responsive UI

Apply WCAG 2.2 AA principles where practical.

### 5.26 Keyboard semantics

Interactive project cards must not be click-only `<div>` elements. Use semantic
buttons/links or complete keyboard handling with correct roles and focus behavior.

All icon-only buttons require accessible names, including:

- modal close
- theme toggle
- mobile menu toggle
- edit
- delete
- back to top

### 5.27 Accessible dialogs

Both project and admin dialogs require:

- `role="dialog"` or native accessible dialog behavior
- `aria-modal="true"`
- an accessible title relationship
- initial focus placement
- focus trapping
- Escape to close
- background scroll lock
- focus restoration to the trigger
- backdrop click behavior that does not interfere with dialog interaction

Do not implement a fragile custom trap when an existing accessible primitive is
already installed.

### 5.28 Navigation accessibility

- mobile menu button uses `aria-expanded` and `aria-controls`
- active-section indication is not color-only
- hash navigation works from every route or public navigation is scoped to public pages
- focus is not lost after mobile menu navigation
- hidden navigation is not focusable when off-screen

### 5.29 Focus visibility

Add a consistent `:focus-visible` treatment for links, buttons, inputs, textareas, and
custom interactive cards. Do not remove outlines without a visible replacement.

### 5.30 Color contrast

Audit design tokens in both themes. The light-theme muted foreground and cyan accent may
be below 4.5:1 for normal text against the light background.

Correct tokens or usage while preserving the design. Test:

- normal body text
- form labels
- placeholder text
- section tags
- buttons
- disabled states
- errors and success messages

### 5.31 Forms and status announcements

- labels must be programmatically associated with controls
- errors should be tied to fields when possible
- success/error status uses an appropriate live region
- loading state is announced
- submit controls remain understandable when disabled
- contact and admin forms preserve user input after recoverable failures

### 5.32 Responsive grids

Audit fixed minimum grid widths such as:

```css
minmax(320px, 1fr)
minmax(300px, 1fr)
```

Prevent horizontal overflow after container padding on small screens. Prefer patterns
such as `minmax(min(100%, 20rem), 1fr)` where supported and appropriate.

### Phase 6 acceptance criteria

- full site is usable with keyboard only
- dialogs manage focus correctly
- all icon buttons have names
- focus is visible
- normal text meets contrast requirements
- no horizontal overflow at 320px
- 200% zoom retains functionality
- automated accessibility checks have no critical violations

---

## Phase 7 — Contact Form, Configuration, and Abuse Controls

Known file: `src/components/Contact.tsx`.

### 5.33 Remove credential placeholders from executable configuration

Known placeholders to verify:

```text
YOUR_SERVICE_ID
YOUR_TEMPLATE_ID
YOUR_PUBLIC_KEY
```

Use validated environment variables or a server-side contact endpoint, based on the
chosen architecture. Do not invent values.

If EmailJS remains client-side, recognize that its public key is intended for browser
use but the form can still be abused. Add appropriate:

- validation
- submission throttling
- honeypot or bot protection
- length limits
- safe error feedback
- environment presence check

Do not expose private EmailJS credentials.

### 5.34 Improve contact error handling

- distinguish missing configuration from send failure in development logs
- provide a safe generic message to public users
- preserve entered content when retry is reasonable
- reset only after confirmed success
- prevent duplicate submissions
- never use an empty catch

### Phase 7 acceptance criteria

- production does not ship executable placeholder credentials
- missing configuration is detected explicitly
- contact input is validated
- duplicate and obvious bot submissions are mitigated
- success and error states are accessible

---

## Phase 8 — Architecture, SEO, Types, and Cleanup

### 5.35 Separate public and admin layouts

Review whether the global `Navigation` should render on `/admin`. Prefer clean route
layout boundaries over client-side hash redirection workarounds.

### 5.36 Correct metadata

Audit `src/app/layout.tsx` for placeholder values such as:

- generic title and description
- `https://myportfolio.dev`
- nonexistent Open Graph image
- inaccurate locale

Required behavior:

- derive base URL from validated configuration
- use real site and owner content supplied by the user
- do not fabricate names or metrics
- ensure Open Graph image exists
- consider per-page metadata for admin and public pages
- prevent admin pages from being indexed where appropriate

### 5.37 Shared database types

Use generated Supabase types when available. Keep types aligned with schema changes.
Avoid duplicate hand-written shapes that drift from the database.

### 5.38 Remove dead code carefully

Candidates may include:

- default `page.module.css`
- unused `ClientRedirect.tsx`
- unused `Hero.tsx`
- unused `FrameSequence.tsx`
- duplicate project hover CSS
- unused imports

Prove each item is unused with repository search and build output before deletion.

### 5.39 Reduce inline-style maintenance burden

Do not convert every inline style merely for stylistic preference. Prioritize styles
that require:

- media queries
- hover/focus states
- reduced-motion variants
- theme variants
- repeated tokens
- accessible state styling

Use the repository's existing styling approach rather than introducing an unrelated UI
framework.

### Phase 8 acceptance criteria

- public/admin layout behavior is intentional
- metadata uses real deployable configuration
- schema and TypeScript types agree
- no proven dead files remain without purpose
- no unused imports or avoidable `any`
- no placeholder production content is silently presented as real

---

## 6. Testing Requirements

Use existing tools first. Add test dependencies only when the value is clear and the
repository lacks a viable alternative.

## 6.1 Static verification

Run the real equivalents of:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also inspect:

- production build warnings
- server/client boundary warnings
- bundle size for heavy 3D code
- accidental exposure of server-only modules
- environment validation behavior

## 6.2 Minimum authentication tests

Cover:

1. missing admin configuration denies access
2. incorrect password fails
3. valid login creates a non-password session
4. tampered session fails
5. expired session fails
6. unauthenticated create fails
7. unauthenticated update fails
8. unauthenticated delete fails
9. authenticated actions succeed under valid input
10. logout invalidates the session
11. repeated failed login attempts are throttled

## 6.3 Minimum validation and storage tests

Cover:

1. empty title rejected
2. oversized description rejected
3. invalid URL scheme rejected
4. invalid project ID rejected
5. unsupported file type rejected
6. oversized file rejected
7. safe image upload succeeds
8. upload success plus DB insert failure removes the new object
9. replacement DB failure preserves the old image and cleans the new upload
10. successful replacement removes or schedules cleanup of the old object
11. successful project deletion cleans storage according to the documented policy
12. partial storage failure is reported and recoverable

## 6.4 Minimum admin UI tests

Cover:

1. submit button prevents duplicate submission
2. failed save preserves form state
3. successful save refreshes without full reload
4. failed delete leaves the item visible
5. successful delete removes the correct item
6. edit modal loads the correct project
7. input text is readable in light and dark themes
8. modal closes by Escape
9. focus returns to the opening control

## 6.5 Minimum public project tests

Cover:

1. database empty -> empty state
2. database error -> error state
3. development mock mode is explicit
4. missing image -> placeholder/no-image state
5. successful like updates list and modal
6. failed like rolls back
7. repeated local click does not duplicate request
8. invalid external URL is not rendered
9. clipboard failure is reported safely
10. share cancellation is not shown as an error

## 6.6 Minimum accessibility tests

Check:

- keyboard navigation
- focus order
- visible focus
- dialog semantics
- icon button labels
- mobile-menu state
- form labels and status announcements
- color contrast
- 320px width
- 200% zoom
- reduced motion

Use automated tooling if already present. Automated checks do not replace manual
keyboard and screen-reader-oriented review.

## 6.7 Minimum 3D tests

Check:

- scroll progress visibly updates the scene
- no duplicate ScrollTriggers after remount
- cleanup removes triggers and listeners
- reduced-motion fallback preserves content
- WebGL failure fallback appears
- mobile quality settings are applied
- no severe console errors during scroll
- no hydration mismatch caused by browser-only logic

---

## 7. Database and Supabase Audit Checklist

Do not declare the application secure until these are inspected.

### Client separation

- anon client contains only public URL and anon key
- service-role key exists only in server-only code
- no service-role import is reachable from a Client Component
- server-only modules use `server-only` where appropriate

### Projects table

- verify column names and nullability
- verify ID type
- verify default values for `likes_count` and timestamps
- verify write access is not granted to the public anon role
- verify public read policy matches product intent

### Storage bucket

- verify whether `portfolio` is public
- verify upload, update, and delete policies
- privileged uploads occur server-side
- public users cannot upload executable or arbitrary content
- cache-control and content type are set intentionally

### `increment_likes` RPC

- inspect function body
- verify `SECURITY DEFINER` usage, if any
- set a safe `search_path` when applicable
- restrict execution privileges
- ensure arbitrary table or row mutation is impossible
- consider rate limiting or deduplication
- confirm `likes_count` cannot become null or invalid

### Migrations

- represent schema changes in migration files
- do not rely on manual dashboard-only changes without documentation
- update generated TypeScript types after migrations

---

## 8. Error-Handling Standard

Use a consistent application error model.

### Server side

- log a stable error code and safe context
- never log secrets, password input, session values, service keys, or raw cookies
- translate infrastructure errors into safe action results
- retain enough detail in server logs for diagnosis

### Client side

- show concise, useful feedback
- preserve user state when retry is possible
- avoid `alert()` as the final production UX
- avoid full-page reload as error recovery
- announce status accessibly

### Error taxonomy example

```text
AUTH_REQUIRED
AUTH_INVALID
AUTH_RATE_LIMITED
CONFIG_MISSING
VALIDATION_ERROR
PROJECT_NOT_FOUND
UPLOAD_INVALID_TYPE
UPLOAD_TOO_LARGE
UPLOAD_FAILED
DATABASE_WRITE_FAILED
STORAGE_CLEANUP_FAILED
LIKE_FAILED
SHARE_FAILED
CONTACT_SEND_FAILED
```

Use names appropriate to the existing codebase. Do not leak raw Supabase messages to
public users.

---

## 9. Dependency Policy

Before adding a dependency, answer in the execution report:

1. What verified problem does it solve?
2. Can the current stack solve it safely?
3. What is its bundle/runtime cost?
4. Is it maintained and compatible with the current framework version?
5. Is it required in the browser or only in development/server code?
6. What new security or maintenance surface does it add?

Do not upgrade all dependencies during a bug-fix phase. Security or compatibility
upgrades must be isolated, tested, and documented.

Never edit the lockfile by hand.

---

## 10. Performance Standard

Measure before and after where tooling is available.

Target outcomes, not guaranteed claims:

- no unnecessary client fetch waterfall for initial projects
- controlled 3D DPR and complexity
- no duplicate animation loops
- no leaked listeners or ScrollTriggers
- no deliberate 1.2-second loading delay unless it serves a verified UX requirement
- images use correct sizes and optimization configuration
- heavy components are split or lazy-loaded when beneficial
- no production mock data or unused heavy components in the bundle

If running Lighthouse is possible, aim for:

- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- Performance: improve from baseline without removing core experience

Record the device/profile and actual scores. Never claim a Lighthouse score that was
not measured.

---

## 11. Definition of Done

The task is complete only when all applicable conditions are met:

### Security

- P0 findings are resolved or explicitly blocked by missing external access
- admin session does not contain the password
- every privileged mutation verifies authorization
- missing configuration fails closed
- upload validation is enforced server-side
- Supabase RLS, storage policies, and RPC security are reviewed

### Correctness

- admin save/delete flows reflect real server results
- project empty, error, image, like, and share states are correct
- no silent catch blocks remain in touched critical paths
- no stale selected-project data
- no invalid `next/image` source

### Quality

- no new unjustified `any`, suppressions, or broad lint disables
- changed code follows current project conventions
- dead code is removed only when proven unused
- comments explain why, not obvious syntax

### Accessibility

- keyboard navigation works
- dialogs handle focus and Escape
- icon buttons have names
- focus is visible
- contrast and mobile overflow are addressed
- reduced-motion behavior is implemented

### Verification

- install succeeds
- lint succeeds
- type-check succeeds
- tests succeed
- production build succeeds
- manual smoke tests are recorded
- remaining warnings and risks are disclosed

### Release documentation

- environment variables are documented in `.env.example` without values
- migrations and deployment order are documented
- rollback procedure is documented
- final report lists actual changed files and actual test results

---

## 12. Required Agent Reporting Format

At the beginning of work, report:

```text
Phase: 0 — Discovery and Baseline
Repository state:
Critical unknowns:
Commands being run:
No source files changed yet.
```

After each phase, report:

```text
Phase completed:
Verified findings:
Files changed:
Why each change was necessary:
Checks run and results:
Remaining risks:
Next phase:
```

At the end, report:

```text
Production-hardening result:
P0 fixed / remaining:
P1 fixed / remaining:
P2 fixed / remaining:
Build status:
Test status:
Accessibility status:
Required environment changes:
Required database migrations:
Deployment sequence:
Rollback sequence:
Manual actions still required:
```

Never use vague statements such as “everything is fixed,” “should work,” or “production
ready” without test evidence.

---

## 13. Stop Conditions

Stop the affected phase and report clearly when:

- required secrets or production credentials are unavailable
- a destructive database migration is unavoidable and no rollback is possible
- the working tree contains conflicting user changes
- the real schema contradicts assumptions
- a required third-party service cannot be verified
- test infrastructure is broken independently of the patch
- the deployment platform is unknown and materially changes the security design

Continue with safe, independent phases when possible. Do not use one blocked task as a
reason to perform unrelated speculative rewrites.

---

## 14. Known Repository-Specific Findings to Verify First

These are evidence-based leads from the supplied source files. Re-verify them against
the live repository before patching because files may have changed.

### P0 leads

1. `src/app/admin/actions.ts` appears to store the submitted admin password directly in
   the `admin_session` cookie.
2. `src/app/admin/page.tsx` appears to authorize by comparing that cookie directly with
   `process.env.ADMIN_PASSWORD`.
3. Missing `ADMIN_PASSWORD` may create fail-open behavior if both compared values are
   absent.
4. `createProject`, `updateProject`, and `deleteProject` appear to call
   `supabaseAdmin` without an internal authorization guard.
5. Uploads appear to trust filename extensions and lack server-side MIME/size checks.
6. Image replacement and project deletion appear not to remove old storage objects.
7. The current project schema and admin action appear designed for one `image_url`; the
   requested five-image gallery requires a verified migration and atomic cleanup plan.

### P1 leads

1. `AdminClient.tsx` appears to call `setLoading(false)` and then read stale `loading`
   state before forcing `window.location.reload()`.
2. Admin delete appears to remove local state without checking the action result.
3. Admin inputs use hard-coded white text that may fail in the light theme.
4. Admin image input is a raw single-file control without drag-and-drop, previews, order,
   cover selection, five-image capacity, per-file state, or reliable progress feedback.
5. `Projects.tsx` appears to substitute mock data for both empty data and query errors.
6. `Projects.tsx` may pass an empty `image_url` to `next/image`.
7. Like state appears to update the project list but leave `selectedProject` stale.
8. Like and share paths contain empty catch blocks.
9. Project cards appear click-only rather than keyboard-semantic.
10. Project and admin modals appear to lack complete dialog focus behavior.
11. `ScrollExperience.tsx` appears to combine mutable GSAP scroll state with
    `frameloop="demand"` without clear invalidation.
12. GSAP timeline cleanup must be verified.
13. EmailJS contains placeholder credentials in executable source.

### P2 leads

1. Root layout appears to render public navigation on the admin route.
2. Public navigation hash links may not work correctly from `/admin`.
3. Metadata contains placeholder domain and Open Graph values.
4. Several files may be unused or duplicated: `Hero.tsx`, `FrameSequence.tsx`,
   `ClientRedirect.tsx`, and default `page.module.css`.
5. Public project data is loaded only after client hydration.
6. Fixed grid minimums may overflow at narrow widths.
7. Light-theme muted and cyan text contrast should be measured.
8. Multiple `any` usages and unused imports should be removed through proper typing,
   not suppression.

These leads define the initial audit queue. They are not permission to patch without
inspection.

---

## 15. Final Operating Principle

Be conservative with architecture, aggressive with verified security defects, precise
with types, explicit with errors, disciplined with tests, and transparent about every
remaining uncertainty.

The correct sequence is always:

```text
UNDERSTAND -> REPRODUCE -> CLASSIFY -> PLAN -> PATCH -> TEST -> REVIEW -> DOCUMENT
```

Never use this sequence:

```text
GUESS -> REWRITE -> SUPPRESS ERRORS -> CLAIM SUCCESS
```
