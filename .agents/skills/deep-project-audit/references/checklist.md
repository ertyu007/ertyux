# Detailed audit checklist

## UI and responsive

- No horizontal page overflow at supported widths.
- Fixed/sticky elements respect safe areas and do not hide content.
- Navigation active state matches the visible section after refresh, hash navigation, back/forward, and long-distance scroll.
- Modals fit short viewports; headers and footers remain reachable.
- Tables and upload grids remain usable on touch devices.
- Tap targets are at least approximately 44×44 CSS pixels.
- Skeleton geometry matches final content closely enough to prevent layout shift.
- Images preserve intentional aspect ratios and expose usable fallbacks.
- Thai and English text wrap without clipping.

## Accessibility

- One logical `h1`; heading order remains coherent.
- Interactive elements use buttons/links appropriately.
- Controls have names, focus styles, keyboard access, and correct disabled state.
- Dialogs expose `role="dialog"`, `aria-modal`, a name, Escape support, focus management, and scroll restoration.
- Decorative visuals are hidden from assistive technology.
- Status/error messages use suitable live-region semantics without excessive announcements.
- Contrast remains readable in light and dark themes.
- Reduced-motion mode avoids scrubbed/looping effects.

## Animation and WebGL

- GSAP timelines do not overlap unintended steps.
- ScrollTrigger instances are unique, refreshed, and cleaned up.
- Returning from the last section to a pinned hero does not leave stale state.
- R3F frame loops and Three.js resources are bounded and cleaned up.
- Mobile quality reduces DPR, particles, geometry, and antialiasing where appropriate.
- 3D objects never make primary text unreadable.

## Async state and media

- Stale requests cannot overwrite newer results.
- Every promise path reaches success, error, or cancellation UI.
- Multiple uploads run with intended concurrency and isolate per-file failures.
- Cancelling upload does not close unrelated UI or leave orphaned storage objects.
- Object URLs are revoked only after use and never leaked.
- Image preload failure cannot keep skeletons forever.
- Submit buttons prevent duplicate mutation.

## Security and admin

- Admin authorization is verified server-side for every mutation.
- Inputs are validated server-side even when the UI validates them.
- Upload extensions, MIME types, size, count, paths, signatures, and ownership are checked.
- Delete/restore actions operate only on exact validated IDs.
- Audit logs avoid storing secrets and remain access-controlled.
- Public project queries exclude deleted/draft content.
- No public client bundle contains server secrets.

## Code health

- No newly introduced lint or TypeScript errors.
- Effects have complete dependencies and cleanup.
- Keys are stable; lists do not rely on indexes when reordering.
- Event listeners, timers, observers, and animation contexts are removed.
- Component state has a single clear source of truth.
- User-visible facts, social links, metadata, and structured data are accurate.
- Production build completes successfully.
