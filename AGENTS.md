# CanvasFeedback agent instructions

Read [`docs/HANDOFF.md`](docs/HANDOFF.md) before changing, building, or deploying this project.

Critical rules:

- Never print, commit, or copy `.env*`, Vercel/Convex tokens, deployment keys, or OIDC credentials.
- Never run `npx convex dev` or `npx convex deploy` without the user's explicit approval at that moment.
- Production currently depends on the recovered September bundle in `recovery-artifacts/`. Do not deploy a normal `npm run build` output over production: the checked-in TSX source predates the September UI.
- Build the production-preserving frontend with `FRAME_ORIGIN=https://canvasfeedback-frame.vercel.app node scripts/build-recovered-output.mjs`, then deploy with Vercel's `--prebuilt` option.
- The untrusted frame service must remain on a separate origin from CanvasFeedback.
- Preserve Staff Rubric, Share with Student, Export for LMS, Fix Checklist, Convex data, shoulder-rehab `srcDoc`, and percentage-based pin coordinates.
- Run all tests and builds listed in `docs/HANDOFF.md` before deployment.

Use GitHub branches and PRs for all changes. Update `docs/HANDOFF.md` whenever architecture, deployment URLs, validation status, or open gaps change so future agents share the same state.
