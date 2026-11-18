# EventSync client

The planner-facing React app. This folder is being rebuilt from scratch on the
`frontend-v2` branch. The old client is preserved in git history on `main`.

**Current state:** login screen only. `/register` and `/dashboard` are temporary
holding screens so the login flow can be walked end to end. Every other route
redirects home.

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 18 (plain JSX, no TypeScript) |
| Build | Vite 6 |
| Styles | Tailwind CSS 3 with tokens in `tailwind.config.js` |
| Routing | React Router 6 (`BrowserRouter`) |
| HTTP | Axios, one instance in `src/api/axios.js` |
| Icons | `lucide-react` (never emoji as an icon) |
| Data cache | none yet; TanStack Query is planned for the list screens |

## Commands

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
npm run build
```

The API must be running (`cd server && npm run seed && npm run dev`). For a
working account use the seeded planner (`demo@eventsync.test` and the password
printed by the seed script, or `SEED_PASSWORD`).

## Design direction: warm editorial

An independent planner's desk, not a generic SaaS dashboard. Ivory paper, ink
text, one terracotta accent, a serif display face, and quiet motion.

Rules that follow from it:

- Colour is earned. Terracotta marks primary actions, current state and brand
  moments only. It is never decoration or a background wash.
- Display type is for headings and large numbers. Labels, buttons, tables and
  body are Inter.
- Depth is a hairline plus one soft shadow. No glass, no gradient text, no
  coloured left borders, no nested cards.
- Motion is 150-250 ms for state changes and one authored entrance per screen.
  Respect `prefers-reduced-motion`.

### Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#FAF9F6` | Page background |
| `surface` | `#FFFFFF` | Inputs, cards, raised panels |
| `wash` | `#F0EBE4` | Hover background for quiet controls |
| `ink` | `#1C1917` | Primary text |
| `ink-soft` | `#44403C` | Labels, secondary headings |
| `onInk` | `#FAF9F6` | Text on the dark panel |
| `onInk-soft` | `#D6D3D1` | Secondary text on ink |
| `onInk-muted` | `#A8A29E` | Meta text on ink |
| `muted` | `#6B645D` | Body secondary, placeholders (≥4.5:1 on canvas) |
| `line` | `#E7E5E4` | Hairlines and input borders |
| `line-strong` | `#D6D3D1` | Hover border |
| `brand` | `#9A3412` | Primary action, links, focus |
| `brand-hover` | `#7C2D12` | Primary hover |
| `brand-soft` | `#FDF2EC` | Tinted brand surface (sparingly) |
| `brand-tint` | `#E9BFA8` | Brand mark on the ink panel |
| `accent` | `#B45309` | Warm highlight, charts later |
| `success` / `warning` / `danger` | `#15803D` / `#B45309` / `#B91C1C` | Semantic state |

Never add a hex value to a component. If a new colour is needed, add a token
here first and document it in this table.

### Type

| Role | Class |
| --- | --- |
| Display / h1 | `font-display text-[2.1rem] sm:text-[2.4rem] leading-[1.08] tracking-[-0.02em]` |
| Section heading | `font-display text-[2rem] leading-[1.1] tracking-[-0.02em]` |
| Body | `text-[0.95rem] leading-relaxed` |
| Label | `text-[0.8rem] font-medium text-ink-soft` |
| Meta / hint | `text-sm text-muted` |

Fraunces (display) and Inter (UI) load from Google Fonts in `index.html` with
`display=swap`. Self-host them before production if the app must work offline.

### Shape and depth

- Radius: `rounded-card` (16px) for panels, `rounded-field` (10px) for controls,
  `rounded-full` for pills.
- Shadows: `shadow-field` (inputs), `shadow-button`, `shadow-card` (larger panels).
- Spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. More space above a
  heading than below it.

## Where things live

```text
client/src/
  api/            axios.js (instance + token + 401), auth.js
  components/     BrandMark, FullScreenLoader, ProtectedRoute
  components/ui/  Button, TextField (shared primitives; add new UI here)
  context/        AuthContext.jsx (token, user, login, logout)
  lib/            apiError.js (Axios error -> human sentence)
  pages/          Login, ComingSoon
  App.jsx         routes
  index.css       Tailwind layers, focus, selection, motion
  main.jsx        React root
```

## Conventions

### API

- Pages never import Axios directly. They call a module in `src/api/`.
- One module per resource (`auth.js`, later `clients.js`, `events.js`, ...).
- Response envelope is `{ success, data, message }`; return `data.data` from the
  module, not the raw response.
- Convert failures with `getErrorMessage(error, fallback)` before showing them.
- Downloads that need the `Authorization` header must use an Axios blob request,
  not a plain `<a href>`.

### Auth

- Token key: `eventsync_token` (do not rename; it is the agreed contract).
- `useAuth()` exposes `{ user, token, loading, login, logout }`.
- A stored token is exchanged for a user with `GET /auth/me` on first load.
- Wrap private routes in `<ProtectedRoute>`.
- `AuthContext` clears the token when `/auth/me` fails.

### Screens

Every async screen ships these states, built with tokens:

1. **Loading** - skeleton or `FullScreenLoader`, never a spinner in the middle of
   content.
2. **Empty** - says what the screen is for and the next action.
3. **Error** - one sentence naming the problem and the recovery.
4. **Success** - real content, working controls.

No `window.confirm` or `window.alert`. Use a styled dialog later, or inline
confirmation for low-risk actions.

### Forms

- Every control has a visible `<label>` linked with `htmlFor`.
- Errors sit under their field and set `aria-invalid` + `aria-describedby`.
- Validate on submit, clear the field error as soon as the visitor types.
- Show a form-level `role="alert"` for server failures.
- Submit buttons show a loading state and disable while the request runs.
- Minimum touch target: 44px.

### Accessibility and browser surfaces

- One `h1` per screen, headings in order.
- Visible `:focus-visible` ring (terracotta) on every control.
- Text contrast: 4.5:1 for body, 3:1 for large text.
- Theme selection, caret, autofill and scrollbars from the palette
  (`src/index.css` already does).
- Test keyboard order and that Escape closes any overlay.

### Responsive

- Mobile first. Check 390, 768, 1024 and 1440.
- Layout changes are structural (columns collapse, tables become cards), not
  fluid type.
- The brand panel on `/login` is `hidden` below `lg`; the form must stand alone.

## Routes and endpoints

| Route | Status | Backend |
| --- | --- | --- |
| `/login` | Built | `POST /auth/login` |
| `/register` | Holding screen | `POST /auth/register` (later) |
| `/dashboard` | Holding screen | `GET /dashboard/summary` (later) |

Planned next, all backed by `server/API.md`:

| Route | Endpoints |
| --- | --- |
| `/dashboard` | `GET /dashboard/summary`, `GET /actions?due=` |
| `/clients` | `/clients`, `/exports/clients.csv`, `/meta/...` |
| `/vendors` | `/vendors`, `/meta/vendor-categories`, `/exports/vendors.csv` |
| `/events` | `/events`, `/exports/events.csv` |
| `/events/:id` | `/events/:id`, `/tasks`, `/vendors`, `/actions?eventId=` |
| `/actions` | `/actions`, `/actions/regenerate` |
| `/settings` | `/profile`, `/profile/password`, `/profile/logo`, `/auth/planner-profile` |
| top bar | `GET /search?q=` |

## How to add a page

1. Create `src/pages/YourPage.jsx`; keep it under ~250 lines and split sections
   into `src/components/<area>/`.
2. Add the API module in `src/api/` (never fetch inside the page).
3. Add the route in `App.jsx`; wrap it in `<ProtectedRoute>` if it needs a user.
4. Use `Button`, `TextField` and existing tokens. Add new primitives to
   `components/ui/` instead of one-off styles.
5. Build loading, empty, error and success states.
6. Check 390 / 768 / 1440 and keyboard focus.
7. Update this README (route table and any new token or primitive).

## Definition of done

- `npm run build` passes with no new warnings.
- No hardcoded hex, shadow or font stack in a component.
- No page-local copy of a button, input or badge.
- Empty, loading, error and success states exist.
- Keyboard: Tab reaches every control, focus is visible, labels are announced.
- Looks right at 390, 768 and 1440; no horizontal scroll.
- This README is updated.

## Skills used for this rebuild

Installed in `.opencode/skills/` and available to future sessions:

| Skill | Source | Version | Licence | Use here |
| --- | --- | --- | --- | --- |
| `impeccable` | <https://github.com/pbakaus/impeccable> (`d41d986`) | 4.9.2 | Apache-2.0 | Design direction, craft floor, Operate-mode UI rules |
| `taste-skill` | <https://github.com/Leonxlnx/taste-skill> (`f6b7657`) | 2.5.1 | MIT | Anti-slop copy and layout checks, typography discipline |

Only the instructions and references are vendored (no generated assets or
headless-browser tooling). Both skills target marketing pages as their main use;
for app screens, apply the craft principles, not the landing-page section rules.
