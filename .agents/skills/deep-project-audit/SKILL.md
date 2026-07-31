---
name: deep-project-audit
description: Perform an exhaustive, evidence-based audit of a web project before release. Use when asked to inspect, review, QA, test, find bugs, verify readiness, check responsive behavior, audit UI/UX, accessibility, animation, performance, security, data handling, TypeScript, lint, build, or regressions in a Next.js/React application.
---

# Deep Project Audit

Audit the current project as if it will be released today. Inspect before changing anything. Report evidence, not guesses.

## Operating rules

1. Read repository instructions and the relevant framework documentation before reviewing implementation details.
2. Preserve user changes and avoid unrelated edits.
3. Separate confirmed defects from risks and suggestions.
4. Reproduce each defect when practical. Record the route, viewport, state, and trigger.
5. Do not call an audit complete while required checks remain unrun.
6. If asked only to review, do not implement fixes. If asked to fix, patch the smallest safe scope and rerun affected checks.
7. Treat security, destructive admin actions, uploads, authentication, and public visibility as high-risk.

## Task framing and implementation discipline

Before changing code:

1. **Define the target**
   - Restate the requested outcome in concrete, observable terms.
   - Record constraints, affected routes, viewports, states, and acceptance criteria.
   - Narrow broad requests into a practical scope without inventing unrelated work.

2. **Collect technical context**
   - Confirm the framework, language, versions, repository conventions, and relevant dependencies.
   - Read the current implementation and data flow before proposing changes.
   - Prefer established project patterns over introducing new libraries or architecture.

3. **Work in small verified increments**
   - Split large work into independently checkable changes.
   - Inspect first, patch the smallest coherent unit, then run targeted checks.
   - Fix and verify one failure class at a time so regressions remain attributable.

4. **Act as the code owner**
   - Never treat generated code as correct without inspection.
   - Check logic, security, accessibility, responsive behavior, error paths, and cleanup.
   - Run repository-supported lint, typecheck, build, and tests before reporting success.
   - Explain remaining warnings, untested states, assumptions, and regression risks.

## Audit workflow

### 1. Establish scope and baseline

- Read `AGENTS.md`, package scripts, framework version, app routes, dirty-worktree state, and relevant framework docs.
- Identify public pages, admin pages, APIs, database/storage integrations, animation systems, and external services.
- Record existing build/lint warnings separately from regressions introduced by the current change.

### 2. Static inspection

- Trace component ownership, data flow, loading/error/empty states, URL/hash behavior, and cleanup logic.
- Search for unsafe assumptions, hard-coded placeholders, stale links, fake claims, secrets, deleted/draft content leaks, and inaccessible controls.
- Inspect race conditions involving effects, uploads, navigation, async state, object URLs, observers, scroll locking, and animation timelines.
- Read [references/checklist.md](references/checklist.md) and apply every relevant section.

### 3. Functional verification

Exercise critical flows:

- Initial load, refresh, direct hash/deep link, back/forward navigation, and return-to-top behavior.
- Theme switching, mobile navigation, reduced motion, keyboard operation, focus visibility, and Escape behavior.
- Loading, success, failure, retry, empty data, slow image, broken image, and offline-like failure states.
- Admin login, create/edit/delete/restore, upload/reorder/cancel, validation, and duplicate submission protection when in scope.
- Modal/drawer open-close behavior, body-scroll restoration, and state cleanup.

### 4. Responsive and visual inspection

Check at minimum:

- 320×568, 375×667, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080.
- Light and dark themes.
- Short-height desktop and landscape mobile.
- 200% zoom and long Thai/English content.

Look for overflow, clipping, layout shift, low contrast, hidden actions, undersized tap targets, sticky/fixed collisions, image distortion, skeleton mismatch, animation overlap, and content obscured by 3D layers.

### 5. Automated checks

Run repository-supported checks in this order:

1. Targeted lint/type checks while iterating.
2. Full lint.
3. Full TypeScript check.
4. Production build.
5. Tests, if present.

If a command fails because of sandbox process/network restrictions, retry through the approved escalation path. Never report a check as passed unless its exit status confirms success.

### 6. Performance and resilience

- Check image dimensions, decoding/loading strategy, preloading scope, duplicate downloads, WebGL quality scaling, animation cleanup, and unnecessary rerenders.
- Verify mobile particle counts, DPR limits, reduced-motion fallback, and no permanent animation work offscreen.
- Check loading UIs for indefinite waits; broken resources must resolve to a usable state.

### 7. Security and data integrity

- Verify server-side authentication and authorization for admin actions.
- Validate upload type, size, count, ownership, signed paths, cleanup, and cancellation behavior.
- Confirm destructive actions target the intended record and require appropriate confirmation.
- Confirm draft/deleted content is absent from public queries.
- Check secrets remain server-side and `.env.local` is not committed or exposed.

## Severity model

- **Blocker:** data loss, auth bypass, secret exposure, broken production build, or unusable primary flow.
- **High:** major flow failure, severe mobile/accessibility failure, persistent state corruption, or public content leak.
- **Medium:** reproducible UI/function defect with a workaround.
- **Low:** polish, consistency, minor accessibility, or maintainability issue.

## Required report format

Lead with the release verdict: `PASS`, `PASS WITH RISKS`, or `FAIL`.

For each finding include:

- Severity and concise title
- Exact file and line when available
- Route, viewport, theme, and reproduction steps
- Expected versus actual behavior
- Evidence or command output
- Smallest recommended fix

Then list:

- Checks executed and their exit status
- Checks not executed and why
- Existing warnings unrelated to the audited change
- Regression risks after fixes

Do not inflate the report with generic best practices. If no defect is found in an area, say it was checked and passed.
