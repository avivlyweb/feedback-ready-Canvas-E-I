# CanvasFeedback durable handoff

Last updated: 2026-09-30 (Europe/Amsterdam)

## Current outcome

The Base44 framing bug is fixed in production. Opening `https://concussion-clarity.base44.app/` in CanvasFeedback renders the real homepage with the “The path back to clarity.” hero rather than a broken-frame icon or SPA 404.

## Canonical locations

- Local recovery repository: `/Users/avivly/Downloads/EI-other-mac-handoff-2026-06-04 2/Education-Innovation/CanvasFeedback-recovered`
- GitHub: `https://github.com/avivlyweb/feedback-ready-Canvas-E-I`
- Main production app: `https://feedback-ready-canvas-e-i.vercel.app`
- Isolated frame service: `https://canvasfeedback-frame.vercel.app`
- Vercel team: `avivlywebs-projects`
- CanvasFeedback project ID: `prj_zvLVqNASRZRuN9TfPwzYyI7m9qpT`
- Frame-service project ID: `prj_kZIDqjknreSeMImt4SSscRGtrCxx`

## Repository history

- Recovery baseline branch: `sync-live-2026-09`
- Feature branch: `feat/frame-fallback`
- Recovery commit: `eea3711` (`chore: sync live version deployed 2026-09-20`)
- Feature commits: `260aebe`, `bf91188`
- Recovery PR #1 merged as `922013c048b68e4fee6d8f99fe4200dc7d522315`
- Feature PR #2 merged as `781118e4aafb126b3dcf12b4e306826dd0c0e0bc`

## Why this repository is unusual

The original local source directory used for the September production deployment could not be found. Vercel retained the exact prebuilt output but not the original React/TypeScript source tree. The GitHub TSX source is from July and does not contain Staff Rubric, Export for LMS, Fix Checklist, or the other newer production UI.

To avoid regressing production, the exact live September bundle is stored under `recovery-artifacts/`. `scripts/patch-live-bundle.mjs` applies a narrowly checked transformation to that bundle, and `scripts/build-recovered-output.mjs` creates `.vercel/output` for deployment. The patcher refuses unknown bundle shapes and verifies preserved feature strings.

Do not replace production with the output of the repository's normal Vite build until the newer UI has been fully reconstructed as maintainable TSX and tested against the live behavior.

## Architecture

CanvasFeedback loads URL projects through:

`https://canvasfeedback-frame.vercel.app/api/frame?url=<encoded student URL>`

The frame service:

1. Accepts only HTTP/HTTPS URLs.
2. Rejects localhost, private/link-local IPv4, `.local`, `.internal`, credentials, and IPv6 literals/destinations.
3. Validates every redirect destination and uses a 12-second abort timeout.
4. Returns `302` to the original URL for ordinary embeddable sites, fetch errors, and non-HTML responses.
5. Proxies blocked HTML when `X-Frame-Options` contains `DENY`/`SAMEORIGIN` or CSP has restrictive `frame-ancestors`.
6. Removes existing `<base>`, inserts the final student origin as the first head child, repairs SPA history using the frame origin plus the student's real path, and injects an absolute frame-origin `/agent.js` URL.
7. Returns `x-canvasfeedback-mode: proxied`, `cache-control: no-store`, and `referrer-policy: no-referrer`.

Untrusted HTML executes on `canvasfeedback-frame.vercel.app`, never the CanvasFeedback application origin. The parent accepts agent messages only from the configured frame origin or the direct student origin.

The CSP sandbox without `allow-same-origin` was tested and deliberately removed: Base44 throws a `SecurityError` when accessing `localStorage` and renders blank. The separate Vercel origin is therefore the mandatory isolation boundary.

## Production-preserving build and deploy

From the repository root:

```bash
npm install
npm test
npm run build
npm --prefix frame-service install
npm --prefix frame-service test
npm --prefix frame-service run build
FRAME_ORIGIN=https://canvasfeedback-frame.vercel.app node scripts/build-recovered-output.mjs
npx vercel deploy --prebuilt
```

Only after verifying the preview in a real browser:

```bash
npx vercel deploy --prebuilt --prod
```

Deploy the frame service from `frame-service/` using its separately linked Vercel project. Confirm the linked project before any production deployment.

## Verification completed

- 2 bundle-patcher tests passed.
- 19 frame-service security/compatibility tests passed.
- Vite build passed.
- Frame-service TypeScript build passed.
- Production Base44 homepage renders “The path back to clarity.” inside CanvasFeedback.
- `/return-to-play` renders “A staged path back to the game.”
- `/recovery-coach` renders “Describe your symptoms, get guidance.”
- A normal Vercel target receives a direct `302` to its original origin.
- `http://localhost:3000` and `http://169.254.169.254/` return `400`.
- `POST /api/snapshot` retains `{ success, url, discoveredPages, breakpoints }`.
- Parent DOM and parent localStorage access from the proxied frame are blocked by cross-origin isolation.
- Production still displays Staff Rubric, Share with Student, Export for LMS, and Fix Checklist.

## Open gaps

- Full Puppeteer screenshot capture and Convex file-storage fallback are not implemented. `/api/snapshot` intentionally remains contract-compatible with the previous stub.
- Pin creation/reopening was not exercised against production because that would add test feedback to live student data.
- The September frontend should eventually be reconstructed from the recovered artifact into maintainable TSX. Until then, use the artifact-preserving build process above.

## Convex safety

- The live bundle points to production deployment `clear-jackal-391`.
- `veracious-egret-454` was confirmed in the Convex dashboard as **Development (Cloud)**.
- No Convex schema, function, or data deployment was made during the frame fix.
- Do not run Convex deployment commands without explicit user confirmation, and never expose deployment keys or `.env.local` contents.

## Secrets and ignored files

`.gitignore` covers `node_modules`, `dist`, `.vercel`, `.env`, `.env.*`, and `.env.local`. Vercel CLI creates ignored local `.vercel/` and `.env.local` files in both the root and `frame-service/`; do not stage or display them.

## Updating this handoff

Every agent that changes this project should update this document with:

- new commits and PRs;
- current preview/production deployment state;
- verification evidence;
- unresolved risks or regressions;
- any change to Convex or Vercel project linkage.
