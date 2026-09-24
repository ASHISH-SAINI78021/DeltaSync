# PRD — AI-Powered Real-Time Collaborative Document Editor

**Author:** [Your Name]
**Status:** Draft
**Last updated:** [date]

---

## 1. Overview

A Notion-style collaborative document editor where multiple users can edit the same document simultaneously with live cursors and selections, plus an AI assistant that suggests edits inline (streamed directly into the document, not a separate chat window). Built as a portfolio project to demonstrate frontend engineering depth: real-time state synchronization, CRDT-based conflict resolution, streaming AI UX, and offline-first behavior.

## 2. Problem Statement

Most collaborative editors either:
- Don't handle real-time conflicts well (last-write-wins, lost edits), or
- Bolt AI on as a disconnected side-panel chatbot rather than a native part of the writing experience

This project solves both: conflict-free multiplayer editing via CRDTs, and AI suggestions that feel like a natural extension of collaborative editing rather than a separate tool.

## 3. Target Users

- **Primary (for demo purposes):** Small teams / individuals collaboratively writing docs — students, small startups, technical writers pairing on documentation
- **Portfolio framing:** Built as if targeting the same market as Notion/Google Docs for a small-to-mid-size team use case

**Scale target:** System should be architected to support **up to 1,000 concurrent users** across documents (not 1,000 users in a single document — realistic concurrent editors per doc: 5–20; the 1,000 figure applies to total active users across the platform, i.e., many documents each with a handful of live collaborators).

This distinction matters for architecture decisions — see Section 6.

## 4. Goals

- Demonstrate real-time, conflict-free collaborative editing using CRDTs
- Demonstrate advanced AI-integrated UX (streaming inline suggestions, not just Q&A)
- Demonstrate scalable real-time architecture thinking, even at demo scale
- Produce a polished, deployed, interview-ready portfolio piece

### Non-Goals (explicitly out of scope for v1)
- Rich permissions/roles (viewer vs editor vs admin) — v2 candidate
- Multi-format export (PDF, DOCX) — v2 candidate
- Mobile native app — responsive web only
- Enterprise-grade auth (SSO, OAuth providers) — basic JWT is sufficient for v1
- Real production-scale load testing — architecture should *support* scaling, but we won't load-test to 1,000 real users

## 5. Features

### P0 — Must have (core demo)
| Feature | Description |
|---|---|
| Real-time collaborative editing | Multiple users edit the same doc live, conflict-free, via Yjs CRDTs |
| Live multiplayer cursors & selections | Each user's cursor, selection, and name/color shown in real time |
| AI inline suggestions | AI streams suggested edits directly into the doc; user can accept/reject like a diff |
| AI Q&A on document | Ask the AI questions about the doc's content, get contextual answers |
| Document dashboard | Create, open, delete documents |
| Basic auth | JWT-based login/signup, associates documents with a user |

### P1 — Should have
| Feature | Description |
|---|---|
| Per-user undo/redo | Correct undo/redo behavior even with concurrent multiplayer edits (Yjs UndoManager) |
| Offline editing + sync | Edit while offline (IndexedDB persistence), auto-sync on reconnect |
| Loading/error/empty states | Every async operation has proper UI feedback |
| Responsive design | Usable on tablet and mobile viewports |
| Accessibility | Keyboard navigation, ARIA labels on interactive elements |

### P2 — Nice to have (stretch, if time allows)
| Feature | Description |
|---|---|
| Document sharing via link | Shareable read/write links without full invite flow |
| Version history | View/restore previous versions of a document |
| AI tone/style rewrite options | E.g. "make this more formal," "shorten this" |
| Presence list | Sidebar showing who's currently viewing/editing |

## 6. Scalability Considerations (1,000-user target)

Even as a portfolio project, the architecture should be **designed** to scale, even if not load-tested at full scale. Document this reasoning explicitly — it's a strong interview talking point.

| Concern | Approach |
|---|---|
| WebSocket connection load | Stateless websocket server design so it can be horizontally scaled behind a load balancer; sticky sessions or a pub/sub layer (e.g. Redis) to sync state across server instances if scaled beyond one node |
| Document state storage | Yjs updates persisted incrementally (not full doc re-save each time) to a database, keyed by document ID |
| Concurrent editors per document | CRDT merge is O(document size), not O(user count) — realistic even with many simultaneous editors per doc |
| AI API cost/rate limits | Debounce/batch AI requests; stream responses to avoid holding connections open unnecessarily |
| Auth/session load | Stateless JWT auth avoids server-side session storage bottlenecks |

**Interview note to prepare:** Be ready to explain the difference between "designed to scale" and "load-tested at scale" — claiming the latter without evidence is a common red flag interviewers probe for.

## 7. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + JavaScript (JSX), Vite |
| Editor | Tiptap (ProseMirror-based) |
| Real-time sync | Yjs (CRDT) + y-websocket |
| Backend | Node.js + Express |
| AI | OpenAI API (streaming) |
| State management | Zustand |
| Styling | CSS Modules (`.module.css`) |
| Offline persistence | IndexedDB (via y-indexeddb) |
| Deployment | Vercel (frontend), Railway/Render (websocket backend) |

## 8. Success Metrics (for a portfolio project)

Since there's no real user base, "success" is measured by:
- Fully working demo deployed and accessible via link
- Demo video showing multiplayer sync + AI streaming in real time
- Ability to clearly explain every architectural decision in an interview setting
- README documents the 4-5 hardest technical problems solved and how

## 9. Milestones / Build Phases

1. Project scaffolding + basic Tiptap editor + Yjs sync (2-browser-tab test)
2. Multiplayer cursors/presence (Yjs awareness protocol)
3. Document dashboard + basic auth
4. AI assistant panel — non-streaming Q&A first
5. Streaming AI edits inline into the doc
6. Undo/redo + offline persistence
7. Polish: loading/error states, accessibility, responsive design
8. Deploy + write README with architecture write-up

## 10. Open Questions

- [ ] Will documents support rich formatting (headings, lists, bold/italic) or plain text only for v1?
- [ ] Should AI suggestions be scoped to selected text only, or can it suggest edits anywhere in the doc?
- [ ] Self-host the websocket server, or use a managed service (e.g. Liveblocks) if time is tight before applying?