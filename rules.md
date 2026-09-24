# Rules.md — Coding Guardrails for This Project

Purpose: this file is meant to be fed to Antigravity (or any AI coding agent) alongside the PRD/Architecture docs, so the agent stays within consistent, interview-defensible boundaries instead of improvising libraries, patterns, or shortcuts mid-build.

---

## 1. Tech Stack — Use Only These

Do not substitute, add, or "upgrade" any of these without asking first, even if the agent thinks an alternative is better.

| Purpose | Use | Do NOT use |
|---|---|---|
| Frontend framework | React + JavaScript | Next.js (adds SSR complexity not needed here) |
| Build tool | Vite | Create React App, Webpack config from scratch |
| Editor | Tiptap | Slate.js, Draft.js, contentEditable from scratch, Quill |
| CRDT / sync | Yjs + y-websocket + y-indexeddb | ShareDB, custom OT implementation, Automerge (unless explicitly switching) |
| State management | Zustand | Redux, Recoil, MobX, Context-only for global state |
| Styling | CSS Modules (`.module.css`) + Vanilla CSS | TailwindCSS, styled-components, CSS-in-JS libraries, Bootstrap |
| Backend | Node.js + Express | NestJS, Fastify, Next.js API routes |
| Auth | Simple JWT | Passport.js (overkill for this scope), Auth0/Clerk (unless AI is instructed to add it later as a stretch feature) |
| AI | OpenAI API (official SDK), streaming | LangChain (unnecessary abstraction for this scope), unofficial wrapper packages |
| Database | [Pick one and lock it in — e.g. MongoDB or PostgreSQL] | Do not let the agent switch databases mid-project |

**Rule:** If the agent suggests a new library mid-build ("I'll add X for this"), it must explain why the existing stack can't do it, and you approve it explicitly before it's installed.

---

## 2. Libraries/Patterns to Avoid Entirely

- **Use clean, idiomatic JavaScript (ES6+)** with JSDoc comments where helpful for complex functions
- **No moment.js** — use native `Intl.DateTimeFormat` or `date-fns` if formatting is genuinely needed
- **No jQuery or DOM manipulation outside React's render cycle** — if the agent reaches for `document.querySelector` inside a component, that's a red flag to stop and ask why
- **No inline styles for anything beyond one-off dynamic values** — CSS Modules and CSS variables only, for scoping and consistency
- **No global mutable state outside Zustand store** — no ad-hoc singletons or module-level `let` variables holding app state
- **No unmanaged `setInterval`/`setTimeout`** without cleanup in `useEffect` — a common source of memory leaks in real-time apps specifically
- **No direct OpenAI calls from the frontend** — API key must never reach the client bundle, all AI calls go through the Express backend
- **No writing directly into the shared Yjs doc from AI-streamed tokens** — must go through the ghost-text/overlay pattern (see Architecture.md §2.3) before being committed as a real transaction
- **No skipping the CRDT layer "just to get it working faster"** — e.g. no falling back to a plain WebSocket broadcast of raw text as a shortcut; if sync breaks, debug Yjs, don't bypass it

---

## 3. Error Handling Requirements

Every feature must handle these three states explicitly — no exceptions:

1. **Loading state** — show a visible loading indicator, never a blank screen during async work
2. **Error state** — catch and display errors meaningfully (not just `console.log(err)`); user-facing message should be human-readable, not a raw stack trace
3. **Empty state** — e.g. "no documents yet" dashboard view, not a blank list

**Specific to this project:**
- **WebSocket disconnects** must be handled gracefully — show a "reconnecting…" indicator, never let the UI silently stop syncing without feedback
- **AI streaming failures** (rate limit, timeout, malformed response) must show a retry option, not fail silently or leave a half-written suggestion stuck on screen
- **Auth token expiry** must redirect to login cleanly, not throw an unhandled 401 in the console
- All API routes on the backend must use a centralized error-handling middleware — no scattered try/catch blocks with inconsistent response shapes
- Every `async` function must have a corresponding `try/catch` or `.catch()` — no unhandled promise rejections

---

## 4. Boundaries for the AI Agent (Antigravity)

These are process rules for how the agent should behave while building, not just code style:

1. **One phase at a time.** The agent must not scaffold future phases (e.g. AI panel code) while working on Phase 1 (basic sync), even if it seems efficient to "set up the structure now."
2. **Explain before generating.** Before writing non-trivial code (anything beyond boilerplate), the agent must briefly explain its approach and wait for confirmation if the approach involves a new pattern not already established in Architecture.md.
3. **No silent architecture changes.** If the agent decides the folder structure or a core pattern (e.g. how Yjs providers are set up) should change from what's in Architecture.md, it must flag this explicitly and explain why — not just do it.
4. **No fabricated library APIs.** If the agent isn't certain about a specific Yjs/Tiptap/OpenAI SDK method signature, it should say so rather than guess — a wrong API call in a real-time sync layer is expensive to debug.
5. **Ask before adding dependencies.** No new npm packages without a one-line justification and explicit approval.
6. **Never remove error handling to "simplify" a demo.** If the agent suggests stripping out loading/error states temporarily to get something working faster, that's fine as a *labeled* temporary step, but it must be flagged as tech debt to fix, not left silently.
7. **Comment the hard parts.** Any code implementing CRDT merge logic, the ghost-text overlay, or undo/redo scoping must include a short comment explaining *why*, since this is exactly what will be discussed in interviews.
8. **No hallucinated scale claims.** The agent should never write comments or docs claiming "this scales to 1000 users" without the corresponding architecture (e.g. Redis pub/sub) actually being implemented — see PRD §6 for the honest framing.

---

## 5. Definition of Done (per feature)

A feature is not "done" until:
- [ ] It works correctly with 2+ simultaneous clients (for real-time features)
- [ ] Loading, error, and empty states are implemented
- [ ] It's keyboard-accessible where applicable
- [ ] Code is clean, modular JavaScript (ES6+) with no unused variables or dead code
- [ ] You (the developer) can explain the implementation out loud without looking at the code