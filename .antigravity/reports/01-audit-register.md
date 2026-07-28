# 01 — Audit Register

| ID | Severity | Area | Evidence | Risk | Proposed Fix | Status |
|---|---|---|---|---|---|---|
| SEC-01 | P0 Critical | Admin Auth | Raw password stored in `admin_session` cookie | Password compromise, session takeover | Implement HMAC-SHA256 session token | RESOLVED |
| SEC-02 | P0 Critical | Server Actions | `createProject`, `updateProject`, `deleteProject` lacked auth checks | Unauthorized DB & Storage mutations | Implement `verifyAdminAuth()` guard | RESOLVED |
| SEC-03 | P0 Critical | File Upload | Unrestricted image upload types/sizes | Server abuse, malicious file uploads | Server-side MIME & 5MB limit check | RESOLVED |
| SEC-04 | P0 Critical | Storage Cleanup | Deleted/updated projects left orphan storage files | Storage leak, orphaned assets | Automatic storage file removal & DB rollback | RESOLVED |
| UI-01 | P1 High | Admin Dashboard | Stale `loading` state check before reload | Failed saves causing data loss | Check `res.success` & `router.refresh()` | RESOLVED |
| UI-02 | P1 High | Admin Contrast | `color: "white"` on light theme inputs | Invisible text in light mode | Use `color: "var(--fg)"` design tokens | RESOLVED |
| UI-03 | P1 High | Projects Modal | Modal & list likes out of sync, no RPC rollback | Inconsistent UI & silent errors | Synchronized state update & RPC rollback | RESOLVED |
| UI-04 | P1 High | Hero Animation | `isLoaded` state caused `heroTextRef.current` null in GSAP | Hero text permanently visible / overlapping | Render `heroTextRef` unconditionally | RESOLVED |
| A11Y-01 | P1 High | Accessibility | Missing `:focus-visible` rings & ARIA attributes | Keyboard users cannot navigate | Add `:focus-visible` & ARIA labels | RESOLVED |
| PERF-01 | P2 Medium | 3D System | GSAP timeline memory leak on remount | Duplicate ScrollTriggers & spacers | Wrap in `gsap.context()` & `ctx.revert()` | RESOLVED |
