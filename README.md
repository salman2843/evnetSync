# EventSync

A MERN workspace for independent event planners: keep clients, events, tasks, vendors, and the next actions for each event in one place.

The backend is being completed first; the React client is kept working but will be redesigned afterwards.

## Status

| Area | State |
| --- | --- |
| Authentication + planner profile | Done |
| Profile editing, password change, business logo upload | Done |
| Clients | Done |
| Events + per-event tasks | Done |
| Vendors | Done |
| Event vendor assignments | Done |
| Action Center (rule engine) | Done |
| Dashboard summary, exports, duplicate event, global search | Planned |
| Frontend redesign | Deferred |

## Stack

- **Backend:** Node.js, Express 4, Mongoose 8, JWT, bcryptjs
- **Frontend:** React 18 (Vite), React Router 6, Tailwind CSS 3, Axios, lucide-react
- **Database:** MongoDB
- **Tests:** `node:test`, `supertest`, `mongodb-memory-server`

## Project structure

```text
Event Sync/
  client/                 React app (Vite)
    src/
      pages/              Login, Register, Onboarding, Dashboard, Clients, Events, Settings
      components/         AppLayout, Modal, EventTypePicker, ProtectedRoute
      context/            AuthContext (token + current user)
  server/
    app.js                Express app (middleware, routes, error handler)
    server.js             Boot + graceful shutdown
    src/
      config/             env.js (dotenv + required vars), db.js, eventTypeCatalog.js
      controllers/        HTTP in/out only
      middleware/         auth, errorHandler, rateLimit
      models/             User, Client, Event, Task, Vendor, EventVendor, ActionItem
      routes/             auth, client, event, profile, vendor, meta, action
      services/           authService, clientService, profileService, storageService, vendorService, assignmentService, actionEngine, actionService
      utils/              validation, apiResponse, asyncHandler, httpError
    tests/                API tests with an in-memory MongoDB
```

## Setup

Requirements: Node.js 20+ and MongoDB running locally.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # then fill in the values
npm run dev                 # http://localhost:5000

# 2. Frontend (optional for now)
cd ../client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

### Environment variables (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port, defaults to `5000` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign login tokens |
| `CLIENT_URL` | No | Allowed CORS origin(s), comma-separated, defaults to `http://localhost:5173` |
| `NODE_ENV` | No | `development` or `production` |
| `UPLOAD_DIR` | No | Folder for uploaded files, defaults to `uploads` |

`server/.env` is gitignored. Keep `.env.example` up to date and never commit real secrets.

## API

Every route except register and login requires `Authorization: Bearer <token>`.
All responses use `{ success, data, message }`.

### Auth

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a planner account |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Current planner and profile |
| `PUT` | `/api/auth/planner-profile` | Save event-type preferences and onboarding state |

### Profile and media

| Method | Route | Description |
| --- | --- | --- |
| `PATCH` | `/api/profile` | Update name, business name, time zone, or currency |
| `PUT` | `/api/profile/password` | Change password; returns a fresh token for this session |
| `POST` | `/api/profile/logo` | Upload or replace the business logo (multipart field `logo`) |
| `DELETE` | `/api/profile/logo` | Remove the business logo and its file |

Logos must be PNG, JPEG, or WebP, at most 2 MB. Files are stored under `server/uploads/logos/` and served from `/uploads/...`; the database stores only the relative path. SVG is rejected on purpose because it can contain script.

### Metadata

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/meta/event-types` | Event-type groups and festival sub-types from the server catalog |
| `GET` | `/api/meta/vendor-categories` | Vendor service categories from the server catalog |

### Clients

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/clients?status=&search=` | List the planner's clients |
| `POST` | `/api/clients` | Create a client (name + phone required, email optional) |
| `GET` | `/api/clients/:id` | One client |
| `PUT` | `/api/clients/:id` | Update a client |
| `DELETE` | `/api/clients/:id` | Delete a client; returns `409` if events still use it |

### Vendors

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/vendors?search=&category=` | List the planner's private vendor directory |
| `POST` | `/api/vendors` | Add a vendor (name required; contact details optional) |
| `GET` | `/api/vendors/:id` | One vendor |
| `PUT` | `/api/vendors/:id` | Update a vendor |
| `DELETE` | `/api/vendors/:id` | Delete a vendor |

Vendor categories are stable IDs from `server/src/config/vendorCatalog.js` (`catering`, `photography`, `venue`, and so on). Vendors are private to the planner who created them.

### Events and tasks

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/events?status=` | List events with task counts |
| `POST` | `/api/events` | Create an event (client, title, type, start date required) |
| `GET` | `/api/events/:id` | Event plus its tasks (undated tasks last) |
| `PUT` | `/api/events/:id` | Update an event |
| `DELETE` | `/api/events/:id` | Delete an event and its tasks |
| `POST` | `/api/events/:id/tasks` | Add a task |
| `PUT` | `/api/events/:id/tasks/:taskId` | Update title, status, priority, or due date |
| `DELETE` | `/api/events/:id/tasks/:taskId` | Delete a task |

### Event vendors

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/events/:id/vendors` | List vendors assigned to the event |
| `POST` | `/api/events/:id/vendors` | Assign a vendor (`vendorId` required) |
| `PUT` | `/api/events/:id/vendors/:assignmentId` | Update status, category, amount, currency, or notes |
| `DELETE` | `/api/events/:id/vendors/:assignmentId` | Remove the vendor from the event |

An assignment status is `considering`, `contacted`, `booked`, or `declined`. A vendor can appear only once per event, a vendor in use cannot be deleted, and deleting an event removes its assignments.

### Action Center

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/actions?status=&eventId=&due=` | List actions; defaults to `open`, `status=all` returns everything |
| `POST` | `/api/actions` | Create a manual action |
| `PATCH` | `/api/actions/:id` | Update status, title, description, priority, or due date |
| `POST` | `/api/actions/regenerate` | Re-run the rule engine and upsert suggestions |

`due` accepts `overdue`, `today`, or `week`. Regeneration is idempotent: each suggestion has a stable `dedupeKey`, so running it repeatedly never creates duplicates and never reopens an action the planner completed or dismissed. Open rule actions whose condition no longer exists are removed.

Rules in `server/src/services/actionEngine.js` (pure functions, no database access):

- Overdue or soon-due tasks
- Events starting within 30 days that are still inquiry/planning
- Upcoming events with no vendors assigned
- Vendors still considering/contacted within 14 days of the event
- Overspent event budgets
- Upcoming events with no tasks

### System

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API and database status |

Validation rules worth knowing:

- Phone numbers are stored as E.164 (`+` followed by 8-15 digits).
- Client email is optional; if present it must be a valid address.
- Event types come from `server/src/config/eventTypeCatalog.js`. Festival sub-types only apply to `festival` events.
- Vendor categories come from `server/src/config/vendorCatalog.js`; unknown IDs are rejected.
- Planner passwords must be at least 8 characters.

## Tests

```bash
cd server
npm test
```

Tests start an in-memory MongoDB, so the real database is never touched.

## Design notes

- The client currently contains three competing color palettes and hardcoded hex values. The redesign will introduce design tokens in `client/tailwind.config.js` and reuse shared UI components.
- There is no brand logo or favicon yet. A static logo will be added with the redesign; per-planner business logo upload belongs to the backend profile work.
- The frontend is intentionally frozen until the backend roadmap is complete.

## Roadmap

Backend phases, in order:

1. **Foundation** – environment loading, shared validation, central errors, optional client email, tests.
2. **Profile & media** – profile editing, password change, business logo upload.
3. **Vendors** – private vendor directory.
4. **Event vendors** – assign vendors to events.
5. **Action Center** – rule-based next actions for each event.
6. **Dashboard** – one summary endpoint.
7. **Convenience** – duplicate event, CSV exports, global search, pagination.
8. **Ops** – seed data, API contract, final test pass.

## Knowledge graph

The repository includes a `graphify-out/` knowledge graph. Read `graphify-out/GRAPH_REPORT.md` before searching sources, and run `graphify update .` after code changes.
