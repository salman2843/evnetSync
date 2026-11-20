# EventSync API reference

Base URL: `http://localhost:5000/api`

All routes except `POST /api/auth/register` and `POST /api/auth/login` require:

```
Authorization: Bearer <jwt>
```

## Response format

Every JSON response uses the same envelope:

```json
{ "success": true, "data": {}, "message": "..." }
```

Errors use `success: false`, a `message` a planner can read, and an HTTP status:

| Status | Meaning |
| --- | --- |
| `400` | Validation problem (bad id, missing field, invalid enum) |
| `401` | Missing, expired, or invalid token; wrong login |
| `404` | Record not found, or not owned by the logged-in planner |
| `409` | Conflict (duplicate email, vendor still assigned, client still has events) |
| `413` | Upload larger than 2 MB |
| `429` | Too many login/register attempts |

CSV exports are the only routes that do not use the JSON envelope.

Every planner-owned query filters by the logged-in `userId`, so records from two planners never mix. Sending another planner's id returns `404`, not `403`, to avoid leaking existence.

## Pagination

List endpoints for clients, events, and vendors accept optional `?page=&limit=`:

- `page` starts at `1`.
- `limit` must be between `1` and `100`; it defaults to `20` when only `page` is sent.
- Sending neither value returns every row, preserving the original response shape.
- When paginating, the response also includes `pagination: { page, limit, total, pages }`.

Actions are returned as a priority-sorted feed rather than a paginated list; use `status` and `due` filters to narrow it.

## Auth

| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ name, email, password, businessName? }` | Password 8+ characters; returns `{ user, token }` |
| `POST` | `/auth/login` | `{ email, password }` | Returns `{ user, token }`; token lasts 7 days |
| `GET` | `/auth/me` | — | Returns `{ user }` with `businessLogo` |
| `PUT` | `/auth/planner-profile` | `{ eventTypeIds?, timeZone?, currency?, completeOnboarding? }` | Kept for the existing client onboarding flow |

`user` contains `id`, `name`, `email`, `businessName`, `businessLogo`, `plannerProfile`, and `createdAt`. `businessLogo` is `{ url, uploadedAt } | null`, where `url` is a local path such as `/uploads/logos/<id>.png`.

## Profile and media

| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| `PATCH` | `/profile` | `{ name?, businessName?, timeZone?, currency? }` | At least one field required |
| `PUT` | `/profile/password` | `{ currentPassword, newPassword }` | Returns a fresh `{ user, token }`; older tokens stop working |
| `POST` | `/profile/logo` | `multipart/form-data`, field `logo` | PNG, JPEG, or WebP; 2 MB max; magic bytes checked |
| `DELETE` | `/profile/logo` | — | Removes the logo field and deletes the file |

Replacing a logo deletes the previous file from disk. SVG is rejected.

## Clients

| Method | Route | Body / query |
| --- | --- | --- |
| `GET` | `/clients?status=&search=&sort=&page=&limit=` | `status` is `New`, `Contacted`, or `Booked`; `sort` is `recent` (default) or `name`; search covers name, company, phone, email. Each client includes `eventCount` and `nextEventAt` |
| `POST` | `/clients` | `{ name, phone, email?, company?, source?, preferredContact?, address?, notes?, status? }` |
| `GET` | `/clients/:id` | — |
| `PUT` | `/clients/:id` | Any editable field, including a partial `{ status }` update from the card |
| `DELETE` | `/clients/:id` | — |

Rules:
- `name` and `phone` are required; phone must be E.164 (`+919876543210`) and is normalized from spaces, dashes, dots, and brackets.
- `email` is optional but validated when present.
- `source` is optional; when set it must be `Referral`, `Instagram`, `WhatsApp`, or `Other`.
- `preferredContact` is `WhatsApp` (default), `Phone call`, or `Email`.
- Deleting a client that still has events returns `409` with the event count.

## Vendors

| Method | Route | Body / query |
| --- | --- | --- |
| `GET` | `/vendors?search=&category=&page=&limit=` | Search covers name, phone, email, address; each vendor includes `assignmentCount` |
| `POST` | `/vendors` | `{ name, serviceCategoryIds?, phone?, email?, website?, address?, notes? }` |
| `GET` | `/vendors/:id` | — |
| `PUT` | `/vendors/:id` | Any editable field |
| `DELETE` | `/vendors/:id` | — |

Rules:
- `name` is required. Contact details are optional but validated when present.
- Category IDs come from `GET /meta/vendor-categories`; unknown IDs are rejected.
- A vendor assigned to an event cannot be deleted (`409`).

## Events and tasks

| Method | Route | Body / query |
| --- | --- | --- |
| `GET` | `/events?status=&clientId=&search=&scope=&page=&limit=` | `search` covers the event title and the client name; `scope` is `upcoming`, `past` or `all` (default). Upcoming reads soonest first, past and all read newest first. Each event includes `taskSummary { total, completed }` |
| `POST` | `/events` | `{ clientId, title, eventTypeId, startAt, subEventTypeId?, surpriseFor?, status?, venue?, budget?, notes?, generateTasks? }` |
| `GET` | `/events/:id` | Returns `{ event, tasks }` |
| `PUT` | `/events/:id` | Any editable field |
| `DELETE` | `/events/:id` | Cascades tasks, vendor assignments, and actions |
| `POST` | `/events/:id/duplicate` | `{ title?, startAt?, clientId? }` |
| `POST` | `/events/:id/tasks` | `{ title, dueAt?, priority? }` |
| `POST` | `/events/:id/tasks/suggested` | Adds the event type's suggested checklist, skipping titles already present |
| `PUT` | `/events/:id/tasks/:taskId` | `{ title?, status?, priority?, dueAt? }` |
| `DELETE` | `/events/:id/tasks/:taskId` | — |

Rules:
- `startAt` is always required; there is no lead-without-date flow.
- `eventTypeId` comes from `GET /meta/event-types`.
- `subEventTypeId` is only valid for `eventTypeId: "festival"`.
- `budget` is `{ amount, spent, currency }`; a partial budget update merges with stored values.
- `venue` is optional: `{ name, address }`, both strings. A virtual or borrowed space needs no venue.
- `generateTasks` defaults to `true` on create: the server adds a suggested checklist for the event type and returns it as `tasks`. Send `false` to start empty; editing an event never adds tasks again.
- Statuses: `inquiry`, `planning`, `confirmed`, `completed`, `cancelled`.
- Task statuses: `open`, `completed`; priorities: `low`, `normal`, `high`.
- Duplicate copies the event and tasks, starts as `inquiry`, resets `budget.spent` to `0`, and shifts task due dates by the event-date change. Assignments and actions are not copied.

## Event vendors

| Method | Route | Body |
| --- | --- | --- |
| `GET` | `/events/:id/vendors` | — |
| `POST` | `/events/:id/vendors` | `{ vendorId, serviceCategoryId?, status?, agreedAmount?, currency?, notes? }` |
| `PUT` | `/events/:id/vendors/:assignmentId` | Any editable field except `vendorId` |
| `DELETE` | `/events/:id/vendors/:assignmentId` | — |

Rules:
- A vendor can appear at most once per event (`409` on a repeat).
- When `serviceCategoryId` is omitted, the vendor's first category is used.
- Assignment statuses: `considering`, `contacted`, `booked`, `declined`.
- Both the event and the vendor must belong to the logged-in planner.

## Action Center

| Method | Route | Body / query |
| --- | --- | --- |
| `GET` | `/actions?status=&eventId=&due=` | Defaults to `status=open`; `status=all` returns everything |
| `POST` | `/actions` | `{ title, description?, priority?, dueAt?, eventId? }` |
| `PATCH` | `/actions/:id` | `{ status?, title?, description?, priority?, dueAt? }` |
| `POST` | `/actions/regenerate` | — |

`due` accepts `overdue`, `today`, or `week`. Every action includes `isOverdue`.

Rules live in `server/src/services/actionEngine.js` as pure functions:

1. Overdue or soon-due tasks (within 7 days).
2. Events starting within 30 days still in `inquiry` or `planning`.
3. Upcoming events (45 days) with no vendors assigned.
4. Vendors still `considering`/`contacted` within 14 days of the event.
5. Overspent event budgets.
6. Upcoming events (30 days) with no tasks.

Regeneration is idempotent:
- Each suggestion has a stable `dedupeKey` and is upserted on `(userId, dedupeKey)`.
- Completed and dismissed actions are never reopened.
- Open rule actions whose condition disappeared are deleted.
- Manual actions are never touched.

Regenerate returns `{ created, updated, removed, total }`.

## Dashboard

`GET /dashboard/summary`

Returns one planner-scoped object:

```json
{
  "generatedAt": "2026-11-18T09:00:00.000Z",
  "events": {
    "total": 4,
    "upcoming": 3,
    "byStatus": { "inquiry": 1, "planning": 1, "confirmed": 1, "completed": 1, "cancelled": 0 },
    "next": [{ "_id": "...", "title": "...", "status": "confirmed", "startAt": "...", "client": { "name": "..." } }]
  },
  "actions": { "open": 5, "overdue": 1, "dueToday": 0, "done": 2, "dismissed": 0, "next": [] },
  "budget": { "byCurrency": [{ "currency": "INR", "planned": 800000, "spent": 350000, "remaining": 450000, "events": 1 }] },
  "vendors": { "total": 5, "assignments": { "considering": 1, "contacted": 2, "booked": 2, "declined": 0, "total": 5 } },
  "clients": { "total": 4 }
}
```

Upcoming means active (`inquiry`/`planning`/`confirmed`) and starting today or later. The `next` lists are capped at 5. Budget totals are grouped by currency and exclude cancelled events.

## Exports

| Method | Route | Content |
| --- | --- | --- |
| `GET` | `/exports/clients.csv` | Name, phone, email, status, address, notes, created |
| `GET` | `/exports/events.csv` | Title, client, type, status, start, budget, spent, currency, notes, created |
| `GET` | `/exports/vendors.csv` | Name, categories, phone, email, website, address, notes, created |
| `GET` | `/exports/actions.csv` | Title, status, priority, type, source, event, due, completed, created |

Downloads are planner-scoped, capped at 5000 rows, and sent as `text/csv` with an attachment filename and a UTF-8 BOM for Excel. Fields containing commas, quotes, or line breaks are escaped.

## Global search

`GET /search?q=`

Searches within the logged-in planner's data:

| Group | Matches on |
| --- | --- |
| `clients` | name, phone, email |
| `events` | title, notes, surprise name |
| `vendors` | name, phone, email, address |
| `actions` | title, description |
| `tasks` | title |

Response:

```json
{
  "query": "ravi",
  "total": 2,
  "results": {
    "clients": [{ "_id": "...", "title": "Ravi Kumar", "subtitle": "+919876543210 · ravi@example.com" }],
    "events": [{ "_id": "...", "title": "Ravi & Meera Wedding", "subtitle": "Ravi Kumar · confirmed", "startAt": "..." }],
    "vendors": [],
    "actions": [],
    "tasks": []
  }
}
```

Each group returns at most 5 matches. The search is case-insensitive, and regex characters are treated as plain text. An empty `q` returns `400`.

## Meta

| Method | Route | Returns |
| --- | --- | --- |
| `GET` | `/meta/event-types` | Event type groups and festival sub-types |
| `GET` | `/meta/vendor-categories` | Vendor category IDs and labels |

## Health

`GET /health` — no token required.

```json
{ "success": true, "data": { "status": "ok", "database": "connected" }, "message": "EventSync API is healthy" }
```

## Seed data

From `server/`:

```bash
npm run seed              # create demo@eventsync.test if it does not exist
npm run seed -- --reset   # delete that planner's data and rebuild it
```

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SEED_EMAIL` | `demo@eventsync.test` | Demo planner email |
| `SEED_PASSWORD` | random, printed once | Demo planner password |

The seed creates 4 clients, 5 vendors, 4 events, 10 tasks, 5 vendor assignments, and a generated Action Center.
