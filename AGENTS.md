<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Working Rules

1. Read the current code and docs before editing.
2. Use the repo's existing patterns first.
3. Keep changes small and scoped to the request.
4. Do not delete files unless they are confirmed unused.
5. Do not commit secrets or `.env.local`.
6. Run lint, typecheck, and build after meaningful changes.
7. Prefer server-side validation for auth, uploads, and admin actions.
8. Keep public pages free of deleted or draft content.
9. Use `apply_patch` for file edits.
10. Report any build, auth, or deployment blocker clearly.
