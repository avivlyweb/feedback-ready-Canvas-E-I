# Recovered production artifacts

These files were downloaded from `https://feedback-ready-canvas-e-i.vercel.app` on 2026-09-29 after the original September source folder could not be found.

- `index-CE_nbZlN.js` is the exact JavaScript bundle served by the production deployment.
- `index-CvrZNA0C.css` is the matching stylesheet.
- `agent.js` is the injected CanvasFeedback agent served by production.

Vercel deployment `dpl_5ok8WWGt7ifauEDQyVG3JPFQ5WWD` also contains compiled `api/proxy` and `api/snapshot` functions, but its retained source tree consists only of `.vercel/output`; the original TypeScript/TSX source was not retained. Never rebuild the July checkout over production without either reconstructing the September UI or using the artifact-preserving patch process documented in the frame-fallback plan.
