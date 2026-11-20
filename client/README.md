# EventSync client

The planner-facing React app. This folder is being rebuilt from scratch on the
`frontend-v2` branch. The old client is preserved in git history.

**Current state:** login, registration, the dashboard plus the clients, vendors and
events card screens are built. `/events/:id`, `/actions` and `/settings` render a
holding screen inside the app shell. The events list is read-only for now; the
event form and detail screen arrive in the next part. Unknown routes redirect
home.

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
| Stat number | `font-display text-[2rem] leading-none tracking-[-0.02em]` |
| Body | `text-[0.95rem] leading-relaxed` |
| Label | `text-[0.8rem] font-medium text-ink-soft` |
| Card label | `text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted` |
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
  api/            axios.js (instance + token + 401), auth.js, clients.js,
                  vendors.js, meta.js, dashboard.js, actions.js, events.js
  components/
    auth/         AuthPanel (shared dark panel for login and register)
    clients/      ClientCard, ClientStatusPill, ClientForm, ClientsToolbar,
                  ClientsSkeleton, ClientsEmpty
    vendors/      VendorCard, VendorForm, VendorsToolbar, VendorsSkeleton,
                  VendorsEmpty
    events/       EventSpotlight, EventsTimeline, EventRow, EventsToolbar,
                  EventsSkeleton, EventsEmpty
    dashboard/    StatCard, NextEvents, ActionFeed, BudgetPanel, PipelinePanel,
                  DashboardSkeleton, EmptyWorkspace
    layout/       AppShell (sidebar, mobile header and tab bar)
    ui/           Button, TextField, PasswordField, PhoneField, Select, Textarea,
                  Badge, Panel, Skeleton, Drawer, ConfirmDialog, Toast,
                  FilterChips, ChoiceFilter, MultiSelectChips
    BrandMark, FullScreenLoader, ProtectedRoute
  context/        AuthContext.jsx (token, user, login, register, logout)
  hooks/          useDashboardSummary.js, useClients.js, useVendors.js,
                  useEvents.js, useDebouncedValue.js, useToast.js
  lib/            apiError.js, contact.js (wa.me/tel/mailto), format.js,
                  events.js (countdown, month grouping, progress),
                  labels.js (enums), validation.js (phone/email), usePageTitle.js
  pages/          Login, Register, Dashboard, Clients, Vendors, Events, ComingSoon
  App.jsx         routes and the guarded-page helper
  index.css       Tailwind layers, focus, selection, motion
  main.jsx        React root
```

## App shell

`<AppShell>` is the signed-in frame. It renders:

- a fixed 256px sidebar at `lg` and up: brand, five primary links, Settings,
  then the planner's initials, name, business name and sign out;
- a sticky top bar below `lg` with the brand, Settings and sign out;
- a fixed bottom tab bar below `lg` (Dashboard, Actions, Clients, Vendors,
  Events) with 56px targets and safe-area padding;
- the page container: `max-w-[76rem]`, `pb-28` on mobile so the tab bar never
  covers content.

`NAV_ITEMS` in AppShell is the single list behind the sidebar and the tabs. Add a
destination there and in `App.jsx`; do not hardcode nav markup in a page.

## Clients screen

`/clients` is a card grid, not a table: one column at 390, two at `md`, three at
`xl`. Each card shows the status pill, name, company and lead source, contact
links, next event, notes (three lines) and one-tap WhatsApp / Call / Email.

- The **status pill is the editor**. It is a native `<select>`; changing it calls
  `PUT /clients/:id` with `{ status }`, updates the card immediately and rolls
  back with a toast if the server refuses. No edit screen is needed for the
  common move from New to Contacted to Booked.
- **New client / Edit** open the shared `Drawer`: right sheet on desktop, full
  screen below `sm`. The form mirrors the server rules in `lib/validation.js`.
- **Delete** uses `ConfirmDialog`, never `window.confirm`. The API returns `409`
  when the client still has events; that message is shown inside the dialog.
  A booked client with no events can be deleted, with a warning. While the client
  has events (or after a refused delete) the confirm button is disabled and the
  only way out is **Close**.
- Search is debounced 300 ms. The status filter, sort and pagination reset to
  page 1 on change. Nine cards per page, Previous/Next at the bottom.

### Filters on a phone

`ui/ChoiceFilter` shows the filter as pills from `sm` up and as the same native
`<select>` below it. Only the branch that is visible is in the tab order, so a
phone spends one compact row on filters instead of two wrapped chip rows, and
the first cards (or the next-event spotlight) are visible without scrolling.
Clients, Vendors and Events all use it; add it to a new list screen instead of
putting `FilterChips` on a phone.

## Vendors screen

`/vendors` is the same card grid as `/clients`, sorted A–Z, nine per page. A card
shows the service badges (first two, then `+n`), name, phone / email / website
links, address, how many events the vendor is on, notes (three lines) and the
same WhatsApp / Call / Email buttons.

- **Services come from the server.** `GET /meta/vendor-categories` is fetched once
  per visit and shared by the filter, the form and the card badges, so a renamed
  category only changes `server/src/config/vendorCatalog.js`.
- The form uses `MultiSelectChips` for services; everything else is a shared
  primitive. Only the name is required, and phone / email / website are validated
  when filled in.
- **Delete** uses `ConfirmDialog`. The API answers `409` while the vendor is
  assigned to an event, and that message is shown inside the dialog. Each list row
  carries `assignmentCount`, so the warning appears before the request is sent.
  When the vendor is in use the confirm button is disabled and only **Close**
  remains, so nobody can repeat the same failed delete.

## Events screen

`/events` is the calendar, not another card grid. It is built in two passes: this
list is read-only, and the event form plus detail screen come next.

- **Next event spotlight** — the soonest active event from today, on the ink
  panel with a serif countdown, its client, task progress and budget. It is the
  screen's one authored entrance and one brand moment.
- **Month timeline** — one raised sheet per month, each row a date block, title,
  client · event type, status pill, task progress and budget. The server returns
  the list already sorted (upcoming soonest first, past and all newest first), so
  the client only inserts the month headings.
- **Toolbar** — debounced search over the event and client name, a status filter,
  and an Upcoming / Past / All dates scope. On a phone both filters are native
  selects (see *Filters on a phone* above); from `sm` up they are chip rows.
  Every change resets to fresh results; old rows are cleared so stale data is
  never read as the new filter.
- **Four empty states**, each with its own next action: no matches (clear the
  filters), nothing upcoming (show the archive), no past events (show upcoming),
  and a brand-new calendar (go to clients, because an event needs a client).
- Search, status and scope are server filters (`GET /events?search=&status=&scope=`)
  so the browser never downloads the whole archive.
- The event name, client, status, progress and budget all come from the list
  response; the row never fetches on hover.

## Phone entry

`ui/PhoneField` is the only phone input. It shows a fixed `+91` box and one
national input capped at ten digits, and it hands the form
`{ target: { name, value } }` with the digits already cleaned. `lib/validation.js`
exports `nationalFromPhone` (edit prefill) and `toE164` (save payload), so a form
never juggles the country code itself. The server still stores one E.164 string.

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
- `useAuth()` exposes `{ user, token, loading, login, register, logout }`.
- Registering stores the returned token and signs the planner in immediately.
- A stored token is exchanged for a user with `GET /auth/me` on first load.
- Wrap private routes in `<ProtectedRoute>` and inside `<AppShell>`; use the
  `privatePage(element)` helper in `App.jsx`.
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

Confirmations that follow an action (a refresh, a completed task) appear in the
dashboard's fixed `role="status"` toast, never in a blocking alert. Errors that
belong to one field stay under that field: a duplicate email on `/register` is
shown on the email input, not in the form banner.

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
- The brand panel on `/login` and `/register` is `hidden` below `lg`; the form
  must stand alone.
- The sidebar gives way to the bottom tab bar below `lg`. Keep primary
  destinations reachable in both.

## Routes and endpoints

| Route | Status | Backend |
| --- | --- | --- |
| `/login` | Built | `POST /auth/login` |
| `/register` | Built | `POST /auth/register` |
| `/dashboard` | Built | `GET /dashboard/summary`, `POST /actions/regenerate`, `PATCH /actions/:id` |
| `/actions` | Holding screen | `GET /actions` |
| `/clients` | Built | `GET /clients` (search, status, sort, page), `POST /clients`, `PUT /clients/:id`, `DELETE /clients/:id` |
| `/vendors` | Built | `GET /vendors` (search, category, page), `POST /vendors`, `PUT /vendors/:id`, `DELETE /vendors/:id`, `GET /meta/vendor-categories` |
| `/events` | Built (list) | `GET /events` (search, status, scope) |
| `/events/:id` | Holding screen | `GET /events/:id` |
| `/settings` | Holding screen | `GET /profile` |

Full endpoint list: `server/API.md`.

## How to add a page

1. Create `src/pages/YourPage.jsx`; keep it under ~250 lines and split sections
   into `src/components/<area>/`.
2. Add the API module in `src/api/` (never fetch inside the page).
3. Add the route in `App.jsx` with `privatePage(<YourPage />)`.
4. Use `Button`, `TextField`, `PasswordField`, `Panel`, `Badge` and existing
   tokens. Add new primitives to `components/ui/` instead of one-off styles.
5. Build loading, empty, error and success states. Reuse `getErrorMessage` and
   the shape of `useDashboardSummary` (data, loading, error, reload).
6. Format dates, money and due dates with `lib/format.js`; take enum labels and
   badge tones from `lib/labels.js` so a status looks the same everywhere.
7. Set the tab title with `usePageTitle('Screen name')`.
8. Check 390 / 768 / 1440 and keyboard focus.
9. Update this README (route table and any new token or primitive).

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
