# CanvasFeedback Frame Fallback Design

## Goal

Render Base44 student sites that prohibit third-party framing while preserving the deployed CanvasFeedback user experience and existing comment-pin coordinates.

## Recovery constraint

The September source directory is missing. Vercel retained the exact prebuilt production output but not the original frontend TSX source. The safest recovery path is artifact-preserving: retain the live static bundle byte-for-byte except for a small, reproducible iframe/message-handling patch, and implement the new frame service from maintainable TypeScript source. The outdated July source remains historical context and must not be rebuilt over production until the September UI is fully reconstructed.

## Architecture

Use a separate Vercel project and origin for untrusted student HTML. Its `/api/frame` endpoint validates public HTTP(S) targets, follows validated redirects, and redirects directly to sites that permit framing. For blocked HTML it rewrites the document base and browser history, injects the CanvasFeedback agent with an absolute URL, removes frame-denial headers, and returns a CSP sandbox without `allow-same-origin`.

The parent canvas points URL projects to the frame service. The existing shoulder-rehab `srcDoc` example remains unchanged. Parent `postMessage` handling accepts only the configured frame origin or the original student origin. A lightweight `check=1` request supplies the preview badge state. The original URL remains available through an “Open live site” control.

## Failure handling

Invalid or private targets return 400. Fetch failures, non-HTML responses, and sites that allow embedding redirect to the original URL. A proxied frame that does not emit `ready` within eight seconds enters screenshot fallback. Screenshot capture is isolated to the frame project; persistence must preserve the existing `/api/snapshot` response shape and must not deploy Convex schema changes without separate approval.

## Verification

Automated tests cover SSRF rules, framing-header classification, HTML rewriting, redirects, and response headers. Preview and production browser checks cover the three Concussion Clarity routes, a normal directly framed site, comment pins at all three widths, origin isolation, and unchanged staff/export/share behavior.
