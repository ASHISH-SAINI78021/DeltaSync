# Phases.md — Build Breakdown

Purpose: break the project into sequential, testable phases. Each phase must be fully working and verified before moving to the next — do not let the AI agent scaffold ahead. Reference PRD.md, ARCHITECTURE.md, and rules.md alongside this file when prompting.

---

## Phase 0 — Setup & Foundations

**Goal:** Repo, tooling, and environments ready before any feature work starts.

- [ ] Initialize monorepo (or separate `client/` + `server/` folders)
- [ ] Set up React + JavaScript + Vite in `client/`
- [ ] Set up Node.js + Express in `server/`
- [ ] Set up global CSS variables & CSS Modules in `client/`
- [ ] Set up ESLint + Prettier (consistent formatting from day one)
- [ ] Create `.env.example` for both client and server
- [ ] Set up basic Git repo with `.gitignore`
- [ ] Deploy an empty "hello world" version of both client and server (Vercel + Railway/Render) — confirms deployment pipeline works before real complexity is added

**Definition of done:** Empty app deploys successfully end-to-end; local dev environment runs both client and server without errors.

---

## Phase 1 — Basic Editor + Real-Time CRDT Sync

**Goal:** Two browser tabs can edit the same document and see each other's changes live. No AI, no auth, no multiplayer cursors yet — just the sync core.

- [ ] Install Tiptap + Yjs + y-websocket + y-prosemirror bindings
- [ ] Set up a basic Tiptap editor component
- [ ] Set up y-websocket server in `server/`
- [ ] Bind Tiptap to a Yjs document via `y-prosemirror`
- [ ] Connect two browser tabs to the same document room and confirm live sync works
- [ ] Handle basic connection states (connected/disconnected indicator)

**Definition of done:** Typing in Tab A appears in Tab B in real time, and vice versa, with no data loss or corruption on concurrent typing.

**Interview talking point to prep here:** Why Yjs's CRDT merge doesn't need a central conflict resolver.

---

## Phase 2 — Multiplayer Cursors & Presence

**Goal:** Each connected user sees where other users' cursors and selections are, in real time, with name/color identification.

- [ ] Implement Yjs Awareness protocol on top of the existing y-websocket connection
- [ ] Assign each client a name + color on connect (can be randomly generated for now, tied to auth in Phase 3)
- [ ] Render remote cursors and selections as editor decorations
- [ ] Handle a user disconnecting (cursor disappears cleanly)

**Definition of done:** With 2+ tabs open, each shows the others' live cursor position, selection highlight, and a name/color label.

---

## Phase 3 — Auth & Document Dashboard

**Goal:** Users can sign up, log in, and manage their own documents instead of using one hardcoded test document.

- [ ] Implement JWT-based signup/login on the backend
- [ ] Build login/signup forms on the frontend
- [ ] Protect document routes with auth middleware
- [ ] Build document dashboard: list, create, open, delete documents
- [ ] Associate documents with the user who created them in the database
- [ ] Validate WebSocket connections against the JWT before allowing a client to join a document room

**Definition of done:** A user can sign up, log in, see only their own documents, create a new one, open it, and edit it — all behind auth.

---

## Phase 4 — AI Assistant Panel (Non-Streaming First)

**Goal:** Get the AI request/response loop working correctly before adding the harder streaming-into-editor behavior.

- [ ] Build the AI panel UI (input box, response display area)
- [ ] Build backend `/ai` route that proxies requests to OpenAI (no streaming yet, just a full response)
- [ ] Support basic Q&A: user asks a question about the doc, gets an answer back
- [ ] Handle loading/error states for AI requests specifically (timeouts, rate limits, malformed responses)

**Definition of done:** User can ask a question about the current document's content in the AI panel and get a correct, displayed answer, with proper loading/error handling.

---

## Phase 5 — Streaming AI Suggestions Into the Editor (Hardest Phase)

**Goal:** AI-suggested edits stream token-by-token into the document as a ghost-text overlay, which the user can accept (commits into the real shared Yjs doc) or reject (discarded, never synced to other users).

- [ ] Switch backend `/ai` route to streamed response (SSE or chunked transfer)
- [ ] Build ghost-text overlay rendering in the editor (visually distinct from committed text)
- [ ] Stream incoming AI tokens into the overlay in real time as they arrive
- [ ] Implement Accept: commit the overlay content into the real Yjs doc as a proper transaction
- [ ] Implement Reject: discard the overlay with no effect on the shared doc
- [ ] Confirm other connected users never see the overlay mid-stream — only the committed result after Accept

**Definition of done:** Triggering an AI suggestion streams text visibly into the doc as a preview; accepting commits it and syncs to other users; rejecting removes it cleanly with zero trace in the shared state.

**Interview talking point to prep here:** Why AI text isn't streamed directly into the shared CRDT doc, and what problem that would cause if it were.

---

## Phase 6 — Undo/Redo & Offline Support

**Goal:** Undo/redo behaves correctly per-user even during concurrent multiplayer editing, and the app remains usable offline with automatic sync on reconnect.

- [ ] Implement Yjs `UndoManager` scoped to the local client's own transactions
- [ ] Test undo/redo correctness with 2+ users editing concurrently
- [ ] Add `y-indexeddb` for local persistence
- [ ] Test offline editing: disconnect network, keep typing, confirm changes persist locally
- [ ] Test reconnect sync: reconnect after offline edits, confirm merge happens correctly in both directions with no data loss

**Definition of done:** Undo only reverts the current user's own changes. Offline edits are preserved and correctly merged on reconnect without conflicts or data loss.

---

## Phase 7 — Polish Pass

**Goal:** Everything that makes the project feel finished rather than "technically working."

- [ ] Add loading/error/empty states to every remaining async flow (documents list, AI panel, auth forms)
- [ ] Responsive design pass — test and fix tablet/mobile viewports
- [ ] Accessibility pass — keyboard navigation, ARIA labels, focus states
- [ ] Visual polish — consistent spacing, typography, color usage via Tailwind
- [ ] Cross-browser check (at minimum Chrome + Firefox)
- [ ] Remove any leftover console.logs, dead code, or TODOs

**Definition of done:** The app feels like a real product, not a prototype — no rough edges in common user flows.

---

## Phase 8 — Deploy & Document

**Goal:** Public, working deployment plus documentation that lets you (and interviewers) understand and discuss the project confidently.

- [ ] Final deploy of client (Vercel) and server (Railway/Render)
- [ ] End-to-end test on the deployed version (not just localhost) — real-time sync, AI streaming, auth, all working live
- [ ] Record a 30-60 second demo video/GIF showing multiplayer sync + AI streaming
- [ ] Fill in README.md fully — architecture, hard problems solved, what you'd improve
- [ ] Fill in ARCHITECTURE.md's Decisions Log with real decisions made during the build
- [ ] Update resume/portfolio with the project link and a one-line description

**Definition of done:** Live link works, demo video exists, README and Architecture docs are complete and accurate, and you can walk through the entire system out loud without hesitating.

---

## How to Use This With Antigravity

- Prompt one phase at a time. Paste the phase's checklist plus relevant sections of PRD.md / ARCHITECTURE.md / rules.md as context.
- Do not let the agent start Phase N+1 work while still inside Phase N, even if it offers to.
- After each phase, manually test the "Definition of done" criteria yourself before moving on — don't take the agent's word that it works.
- Update ARCHITECTURE.md's Decisions Log as you go, not at the end.