# CanvasFeedback Frame Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make blocked Base44 student apps render safely in CanvasFeedback, including the production Concussion Clarity project.

**Architecture:** Preserve the exact September frontend artifact and patch only its iframe URL and message-origin behavior. Deploy a separately originated Vercel frame service that decides between a direct redirect and sandboxed HTML proxying, with screenshot fallback when the injected agent does not become ready.

**Tech Stack:** Vite, React 19, TypeScript, Vercel Functions, Node test runner, Convex (unchanged unless separately approved)

---

### Task 1: Secure frame-service core

1. Write failing tests for URL validation, framing-header classification, and HTML rewriting.
2. Run the tests and confirm the expected failures.
3. Implement the minimum validation, decision, timeout, redirect, rewrite, and response-header logic in `frame-service/lib/frame.ts` and `frame-service/api/frame.ts`.
4. Run the tests and confirm all pass.

### Task 2: Agent and snapshot compatibility

1. Write failing compatibility tests for the agent message schema and snapshot response shape.
2. Restore the live agent and implement `/api/proxy` through the secure proxy core while retaining `/api/snapshot` compatibility.
3. Confirm the compatibility tests pass.

### Task 3: Reproducible production-frontend patch

1. Write a failing bundle-patcher test against the retained live artifact.
2. Implement a deterministic patch limited to iframe URL loading, origin validation, preview status, open-site control, and readiness timeout.
3. Assert the output still contains Staff Rubric, Share with Student, Export for LMS, and Fix Checklist.

### Task 4: Safe repository synchronization

1. Complete `.gitignore` protection for build and environment files.
2. Verify no environment file is staged.
3. Commit the recovered baseline on `sync-live-2026-09`, push, and open a PR without merging until confirmed.
4. Create `feat/frame-fallback` from the synchronized baseline.

### Task 5: Preview deployment and acceptance tests

1. Build both projects from clean installs.
2. Deploy the separate frame project and patched CanvasFeedback frontend as previews.
3. Run all eight acceptance checks, fix evidenced failures, and repeat.

### Task 6: Production deployment

1. Deploy the frame service to its production domain.
2. Build the frontend patch using that origin and deploy CanvasFeedback production.
3. Verify the production Concussion Clarity homepage contains “The path back to clarity.” inside the canvas and remains interactive.
4. Push the feature branch, open its PR, and report URLs, commits, and acceptance results.
