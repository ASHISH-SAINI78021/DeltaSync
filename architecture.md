# Architecture — AI-Powered Real-Time Collaborative Document Editor

**Status:** Draft — update as you build each phase. This doc should evolve alongside the code, not be written after the fact.

---

## 1. High-Level System Overview

Three main runtime pieces:

1. **Frontend (React + Vite)** — the editor UI, multiplayer cursors, AI panel, dashboard
2. **Sync server (Node.js + y-websocket)** — relays CRDT updates between connected clients, persists document state
3. **AI layer (OpenAI API)** — called from the backend (never directly from the frontend, to protect API keys), streams responses back to the client

```
┌─────────────┐         WebSocket          ┌──────────────────┐
│  Client A   │◄──────────────────────────►│                  │
│ (Tiptap +   │                            │  Sync Server      │
│  Yjs doc)   │                            │  (y-websocket)    │
└─────────────┘                            │                  │
                                            │  - Relays Yjs     │
┌─────────────┐         WebSocket          │    updates        │
│  Client B   │◄──────────────────────────►│  - Persists doc   │
│ (Tiptap +   │                            │    state to DB    │
│  Yjs doc)   │                            │                  │
└─────────────┘                            └──────────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │   Database        │
                                            │ (doc snapshots +  │
                                            │  incremental      │
                                            │  updates)         │
                                            └──────────────────┘

┌─────────────┐         REST/HTTP          ┌──────────────────┐
│  Client      │──────────────────────────►│  Express API      │
│ (AI panel)   │◄── streamed response ──── │  → OpenAI API      │
└─────────────┘                            └──────────────────┘
```

---

## 2. App Flow

### 2.1 Document editing flow (real-time sync)
1. User opens a document → client establishes a WebSocket connection to the sync server, scoped to that document's room/ID
2. Client loads the Yjs doc — either from IndexedDB (local cache, for offline support) or fetched fresh from the server
3. As the user types, Tiptap emits changes → Yjs encodes them as CRDT updates
4. Yjs update is broadcast over the WebSocket to all other clients in the same document room
5. Other clients receive the update and merge it into their local Yjs doc — no manual conflict resolution needed, CRDT merge is automatic and commutative
6. Sync server periodically persists the Yjs doc state to the database (debounced, not on every keystroke)

### 2.2 Multiplayer cursor/presence flow
1. On connect, client broadcasts its "awareness" state (user name, color, cursor position) via Yjs awareness protocol
2. Awareness updates are relayed the same way as doc updates — over the same WebSocket connection, but as ephemeral state (not persisted)
3. Each client renders remote cursors by subscribing to awareness state changes and mapping them to editor decorations

### 2.3 AI inline suggestion flow (the hard one)
1. User triggers AI assist (e.g. selects text + clicks "Improve" or types a prompt in the AI panel)
2. Client sends the request (selected text + context + instruction) to the Express backend
3. Backend calls OpenAI API with `stream: true`
4. Backend relays the stream back to the client (Server-Sent Events or chunked response)
5. Client inserts streamed tokens into the Yjs doc as a **provisional/ghost-text overlay** — not committed to the shared doc yet
6. On accept: the ghost text is committed as a real Yjs transaction (so it becomes part of the CRDT and syncs to other users)
7. On reject: the overlay is discarded, no change to the real doc state

> Why not stream directly into the live shared doc? Because other users would see raw, possibly-rejected AI text appearing mid-generation. The ghost-text/overlay pattern keeps AI suggestions local until explicitly accepted.

### 2.4 Undo/redo flow
1. Each client has its own Yjs `UndoManager` scoped to that client's own transactions only
2. Undo reverts only the current user's last change, even if other users' edits happened in between — Yjs tracks transaction origin to make this possible

### 2.5 Offline flow
1. `y-indexeddb` persists the Yjs doc locally on every change
2. If the WebSocket disconnects, the user can keep editing — changes accumulate locally in the Yjs doc
3. On reconnect, Yjs's sync protocol exchanges state vectors with the server and merges any missed updates in both directions — no manual "diffing," CRDT merge handles it

### 2.6 Auth flow
1. User signs up/logs in → backend issues a JWT
2. JWT stored client-side (httpOnly cookie preferred over localStorage for security)
3. JWT sent with REST requests (document list, create/delete) and validated on the WebSocket connection handshake (so only authorized users join a document's room)

---

## 3. Folder & File Structure

```
project-root/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── Editor.jsx               # Tiptap + Yjs binding
│   │   │   │   ├── RemoteCursors.jsx         # Renders other users' cursors
│   │   │   │   ├── AISuggestionOverlay.jsx   # Ghost-text streaming UI
│   │   │   │   └── Toolbar.jsx
│   │   │   ├── ai-panel/
│   │   │   │   ├── AIPanel.jsx               # Q&A + suggestion trigger UI
│   │   │   │   └── DiffPreview.jsx           # Accept/reject suggestion diff view
│   │   │   ├── dashboard/
│   │   │   │   ├── DocumentList.jsx
│   │   │   │   └── DocumentCard.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── SignupForm.jsx
│   │   │   └── common/                       # Buttons, loaders, empty states, etc.
│   │   ├── hooks/
│   │   │   ├── useYjsDoc.js                  # Sets up Yjs doc + provider per document
│   │   │   ├── useAwareness.js               # Multiplayer presence state
│   │   │   └── useAIStream.js                # Handles streaming AI responses
│   │   ├── store/
│   │   │   └── useAppStore.js                # Zustand store (auth state, UI state)
│   │   ├── lib/
│   │   │   ├── api.js                        # REST calls to backend
│   │   │   └── yjsSetup.js                   # Shared Yjs/provider config
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DocumentPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── server/                          # Backend (Node + Express)
│   ├── src/
│   │   ├── websocket/
│   │   │   └── syncServer.js                 # y-websocket setup, room handling
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── documents.routes.js
│   │   │   └── ai.routes.js                  # Proxies streamed OpenAI calls
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── documents.controller.js
│   │   │   └── ai.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js            # JWT verification
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Document.js
│   │   ├── persistence/
│   │   │   └── yjsPersistence.js             # Debounced Yjs state saving to DB
│   │   └── index.js                          # Express app entry point
│   └── package.json
│
├── shared/                          # (optional) shared JS utils/types between client/server
│   └── index.js
│
├── PRD.md
├── ARCHITECTURE.md
├── README.md
└── package.json                     # Root, if using a monorepo tool (e.g. Turborepo)
```

**Reasoning for this structure:**
- **`client/` and `server/` are fully separated** — this mirrors real production setups where frontend and backend deploy independently (Vercel + Railway), and makes the separation of concerns obvious in an interview walkthrough
- **`hooks/` isolates all Yjs/real-time logic** from UI components — components stay dumb and presentational; the hard synchronization logic lives in one testable, reusable place
- **`ai-panel/` is separate from `editor/`** even though they interact closely, because the AI suggestion UI (diff preview, accept/reject) is a distinct concern from the core editing surface — this separation is itself a talking point about component boundaries
- **`persistence/` on the backend is isolated** from the websocket relay logic, since "relay updates" and "save state to DB" are different responsibilities with different failure modes (e.g. DB write failures shouldn't break real-time sync)

---

## 4. Tech Stack (with reasoning)

| Layer | Choice | Why this over alternatives |
|---|---|---|
| Frontend framework | React + JavaScript, Vite | Fast dev iteration, straightforward JSX components without complex build overhead |
| Editor | Tiptap (ProseMirror) | Native Yjs bindings exist (`y-prosemirror`), extensible node/mark system, avoids building a rich-text editor from scratch |
| Conflict resolution | Yjs (CRDT) | Merges concurrent edits automatically and commutatively — no central lock or operational-transform server logic needed; well-documented, production-proven (used by Notion-likes, Jupyter, etc.) |
| Real-time transport | y-websocket | Purpose-built for relaying Yjs updates; simpler than hand-rolling a Socket.io protocol for this specific use case |
| Backend | Node.js + Express | Matches y-websocket's Node ecosystem; simple REST layer for auth/documents/AI proxy |
| AI | OpenAI API (streamed) | Streaming is essential for the inline-suggestion UX goal; called server-side to keep the API key secret |
| State management | Zustand | Lightweight for UI-only state (auth, panel open/closed); Yjs itself already manages document state, so a heavier tool like Redux would be redundant |
| Styling | CSS Modules (`.module.css`) + Vanilla CSS | Modular, scoped styling without global class collisions or third-party framework overhead |
| Offline persistence | y-indexeddb | Yjs-native local persistence; integrates directly with the same CRDT doc, no separate offline-sync logic needed |
| Deployment | Vercel (frontend) + Railway/Render (backend) | Vercel is optimized for static/SSR frontend deploys; WebSocket servers need a long-running process host, which Vercel's serverless model doesn't support well — hence splitting deployment targets |

---

## 5. Key Architectural Decisions Log

Keep this updated as you build — it's your interview cheat sheet.

| Decision | Alternatives considered | Why this choice |
|---|---|---|
| CRDT (Yjs) over Operational Transform | Custom OT implementation | OT requires a central server to sequence operations correctly and is notoriously hard to implement correctly; CRDTs merge peer-to-peer without that requirement |
| Ghost-text overlay for AI suggestions | Streaming directly into shared Yjs doc | Prevents other collaborators from seeing unreviewed/rejected AI output mid-stream |
| AI calls proxied through backend | Direct client → OpenAI calls | Protects API key; allows request-level rate limiting/logging |
| [Add more as you make real decisions during the build] | | |

---

## 6. Scalability Notes (ties to PRD Section 6)

- Sync server should be stateless per-connection where possible so it can scale horizontally behind a load balancer
- For multi-instance scaling, awareness/update broadcast would need a pub/sub layer (e.g. Redis adapter) so clients connected to different server instances still sync — **not implemented in v1, but documented here as the next step if scaling beyond a single instance**
- Document persistence should batch/debounce writes rather than writing on every keystroke, to avoid database write amplification at scale