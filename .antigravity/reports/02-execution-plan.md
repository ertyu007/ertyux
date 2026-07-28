# 02 — Execution Plan

## Phase Overview

### Phase 1: Security & Auth Hardening
- Implement HMAC SHA-256 session tokens.
- Add `verifyAdminAuth()` server-side guard to all Server Actions.
- Implement login rate limiting.

### Phase 2: Server Action Validation & Storage Cleanup
- Enforce 5MB limit and MIME type allowlist.
- Add automatic storage file deletion on project update/delete.
- Add upload rollback if database insertion fails.

### Phase 3: Admin Dashboard & Type Safety
- Replace `any` types with `Project` interface.
- Use `res.success` and `router.refresh()` instead of `window.location.reload()`.
- Theme-aware form inputs (`var(--fg)`, `var(--bg-2)`).

### Phase 4: Projects & Modal Interactivity
- Empty state handling when database is empty.
- Synchronize like counts between list and modal with RPC rollback.
- Keyboard accessibility (`Enter`/`Space`), Escape key modal closing, body scroll locking.

### Phase 5: 3D System & Motion Optimization
- Fix `heroTextRef.current` null bug by removing `isLoaded` DOM unmounting.
- Add `gsap.context()` cleanup on unmount.
- Add interactive custom glowing cursor, scroll progress bar, mouse-following light & octahedron orb.

### Phase 6: Accessibility, SEO & Clean Code
- Add `:focus-visible` styling and ARIA attributes.
- Fix Light Theme contrast ratios (>4.5:1).
- Remove dead code (`Hero.tsx`, `FrameSequence.tsx`, `ClientRedirect.tsx`, `page.module.css`).
