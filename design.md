# Design.md — Visual Design System

Purpose: lock in a consistent, intentional visual identity before UI work starts, so the app doesn't end up looking like default Tailwind scaffolding. Reference this file when prompting Antigravity for any UI component.

---

## 1. Design Direction

**Feel:** Calm, focused, "writing tool" energy — closer to Notion/Linear than a flashy SaaS landing page. The editor is the star; chrome around it should stay quiet.

**Principle:** The AI and multiplayer features should feel *ambient*, not loud — subtle color cues (cursor colors, AI ghost-text tint) rather than heavy UI chrome, badges, or animation.

Avoid: generic purple-gradient "AI startup" aesthetic (overused, reads as templated). Avoid: default shadcn/Tailwind blue-on-white with no personality.

---

## 2. Color Palette

### Base (light mode — build this first)
| Role | Color | Hex |
|---|---|---|
| Background (page) | Warm off-white | `#FAF9F6` |
| Background (editor surface) | Pure white | `#FFFFFF` |
| Background (sidebar/panels) | Soft gray | `#F3F2EF` |
| Text — primary | Near-black, not pure black | `#1A1A18` |
| Text — secondary/muted | Warm gray | `#6B6862` |
| Border/divider | Light warm gray | `#E5E3DD` |
| Accent (primary actions, links) | Deep indigo | `#4F46E5` |
| Accent hover | Slightly darker indigo | `#4338CA` |

### Semantic colors
| Role | Color | Hex |
|---|---|---|
| Success (e.g. "synced," "saved") | Muted green | `#2E7D5B` |
| Warning (e.g. "reconnecting…") | Amber | `#B7791F` |
| Error | Muted red | `#C0362C` |
| AI ghost-text tint | Soft lavender background | `#EEEBFB` with `#4F46E5` text at 70% opacity |

### Multiplayer cursor colors
Assign from a fixed rotating palette so colors are distinguishable and never clash with the accent color above:
```
#E5484D  (red)
#F5A623  (orange)
#2E7D5B  (green)
#0EA5E9  (blue)
#D946A0  (pink)
#9333EA  (purple)
```
Cycle through this list by user-join-order; don't randomize per session (keeps a user's color consistent if they reconnect).

### Dark mode (v2 / stretch — don't build first, but reserve the tokens)
| Role | Hex |
|---|---|
| Background (page) | `#17171A` |
| Background (editor surface) | `#1F1F23` |
| Text — primary | `#EDECE9` |
| Accent | `#818CF8` (lighter indigo for contrast on dark bg) |

**Rule:** Define all colors as CSS variables / Tailwind theme extensions from day one, even before dark mode is built — this makes adding dark mode later trivial instead of a re-skin. Never hardcode hex values inside components.

---

## 3. Typography

### Font choices
| Use | Font | Fallback stack |
|---|---|---|
| UI (buttons, nav, panels, dashboard) | **Inter** | `system-ui, -apple-system, sans-serif` |
| Editor body text | **Source Serif 4** or **Lora** (serif — makes the writing surface feel distinct from the UI chrome, like a real document) | `Georgia, serif` |
| Code (if any code blocks in the editor) | **JetBrains Mono** | `Menlo, monospace` |

**Reasoning:** Using a serif for the actual document content and a sans-serif for surrounding UI is a deliberate choice that mirrors real writing tools (Notion, Medium, Bear) — it signals "this is a document" vs. "this is app chrome," and it's a detail that shows design intent rather than just using one font everywhere by default.

### Type scale
| Token | Size | Weight | Use |
|---|---|---|---|
| `text-xs` | 12px | 400 | Timestamps, helper text, cursor name labels |
| `text-sm` | 14px | 400 | Secondary UI text, form labels |
| `text-base` | 16px | 400 | Body/default UI text |
| `text-lg` | 18px | 500 | Panel headers, section titles |
| `text-xl` | 20px | 600 | Dashboard page titles |
| `text-2xl` | 24px | 600 | Editor document title |
| Editor body | 17px | 400 | Document content (serif font, slightly larger than UI base for readability) |
| Editor headings (H1/H2/H3) | 28px / 22px / 18px | 700 | In-document headings (serif) |

### Line height & spacing
- UI text: `1.5` line-height
- Editor body text: `1.7` line-height (documents need more breathing room than UI chrome)
- Base spacing unit: 4px (Tailwind default scale) — stick to it, don't introduce arbitrary pixel values

---

## 4. Component Style Notes

- **Buttons:** Rounded corners (`rounded-lg`, ~8px), no heavy drop shadows — flat with a subtle 1px border or solid fill, matching the calm/quiet direction
- **Panels/cards:** Very subtle shadow (`shadow-sm`) or just a 1px border — avoid the generic "floating card with big shadow" SaaS look
- **AI ghost-text overlay:** Rendered with the lavender tint background + slightly reduced opacity text, with a small inline accept (✓) / reject (✕) control at the end of the suggestion — not a separate modal or sidebar for accept/reject, keep it inline and low-friction
- **Multiplayer cursors:** Thin colored vertical line + small rounded label tag with the user's name, matching their assigned color from the palette above
- **Connection status indicator:** Small dot (green = synced, amber = reconnecting, red = offline) in a consistent corner — never a large banner unless the disconnect is prolonged

---

## 5. What to Avoid

- No default Tailwind blue (`blue-500` / `indigo-600` defaults) without adjusting — pick the specific hex values above so the palette feels intentional
- No purple-to-pink gradients — overused "AI product" cliché
- No emoji-heavy UI copy — keep tone clean and minimal
- No more than one accent color driving primary actions — secondary colors are for semantic states only (success/warning/error), not decoration
- Don't mix more than 2 typefaces total (UI sans + editor serif [+ mono only if code blocks exist])

---

## 6. Implementation Notes for CSS Modules

Define all design tokens as native CSS custom properties in global `index.css`:

```css
/* src/index.css */
:root {
  --bg-page: #FAF9F6;
  --bg-surface: #FFFFFF;
  --bg-panel: #F3F2EF;
  --text-primary: #1A1A18;
  --text-muted: #6B6862;
  --border-color: #E5E3DD;
  --color-accent: #4F46E5;
  --color-accent-hover: #4338CA;
  --color-success: #2E7D5B;
  --color-warning: #B7791F;
  --color-danger: #C0362C;
  --bg-ai-tint: #EEEBFB;

  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', Menlo, monospace;
}
```

Import scoped styles per component using `.module.css` files:

```jsx
// src/components/editor/Editor.jsx
import styles from './Editor.module.css';

export function Editor() {
  return <div className={styles.editorContainer}>...</div>;
}
```

This keeps every color/font decision centralized in global variables while scoping styles cleanly using CSS Modules without global class collisions.