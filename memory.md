# Memory.md — Build Progress Tracker

Purpose: a living log of what's been completed, what's in progress, and what's next — so you (or Antigravity, if you paste this in as context) never lose track of state across sessions. Update this **every time you finish a task or switch files**, not at the end of the day from memory.

---

## How to Use This File

- Update it in real time, not retroactively — memory of "what I did" fades fast across multi-day builds
- Before starting a new Antigravity session, paste the "Currently Working On" + "Last Completed" sections in as context so the agent doesn't re-scaffold or contradict existing code
- Move items from "In Progress" to "Completed" only once they pass their Definition of Done (see phases.md)
- Keep "Known Issues / Blockers" updated — don't let bugs silently disappear from tracking

---

## Current Status

**Current phase:** Phase 5 Completed — Ready for Phase 6 (Undo/Redo & Offline Support)
**Last updated:** 2026-09-22

---

## Currently Working On

| File/Area | What's being done | Status |
|---|---|---|
| Phase 6 Undo/Redo & Offline Support | Scoping Yjs UndoManager & IndexedDB persistence | Queued / Up Next |

---

## Completed

| Phase | Task | File(s) | Date completed | Notes |
|---|---|---|---|---|
| Phase 0 | Scaffold client & server, CSS Modules setup | `client/*`, `server/*`, `.gitignore` | 2026-09-13 | Client React+JS+Vite, Server Express, design tokens in `src/index.css` |
| Phase 1 | Basic Editor + Yjs CRDT Sync | `Editor.jsx`, `syncServer.js`, `index.js` | 2026-09-13 | Tiptap editor with Yjs collaboration, WebSocket server on `/ws/<doc-name>`, live sync status badge |
| Phase 2 | Multiplayer Cursors | `Editor.jsx`, `userColors.js`, `Editor.module.css` | 2026-09-13 | Tiptap `CollaborationCursor`, Yjs Awareness protocol, dynamic cursor colors and names |
| Phase 3 | Auth & Dashboard | `Auth.jsx`, `Dashboard.jsx`, API Routes | 2026-09-13 | JWT + MongoDB authentication, WebSocket JWT validation, React Router SPA implementation |
| Phase 4 | AI Assistant Panel | `AIPanel.jsx`, `/api/ai/ask` route | 2026-09-19 | Non-streaming AI document Q&A panel backed by OpenRouter Llama 3.1 |
| Phase 5 | Streaming AI Suggestions | `GhostTextOverlay.jsx`, `/api/ai/stream` route | 2026-09-19 | SSE streaming AI token suggestions into ghost text overlay, accept/reject actions |

---

## Up Next (queued, not started)

- [ ] Phase 6: Implement Yjs `UndoManager` scoped to local client's transactions
- [ ] Phase 6: Add `y-indexeddb` for local persistence
- [ ] Phase 6: Test offline editing & automatic reconnect sync
- [ ] Phase 7: Polish Pass (loading/error states, responsive layout, visual polish)
- [ ] Phase 8: Deploy & Document (Vercel + Railway/Render, demo, documentation update)

*(Copy the next phase's checklist from phases.md here once Phase 0 is done — don't keep the whole phases.md checklist duplicated here, just the active phase.)*

---

## Known Issues / Blockers

| Issue | Where | Severity | Notes |
|---|---|---|---|
| — | — | — | — |

---

## Decisions Made Mid-Build

(Quick log — move the detailed version into ARCHITECTURE.md's Decisions Log once confirmed. This is just a fast scratchpad so nothing gets lost mid-session.)

- [date] — [decision] — [why]

---

## Session Log

Keep brief entries per work session — useful for reconstructing context after a break of a few days.

### [date]
- Started: [phase/task]
- Completed: [what actually got done]
- Stopped because: [ran out of time / hit a blocker / end of session]
- Next step when resuming: [exact next action, so you don't waste time re-orienting]