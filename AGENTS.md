# EventSync project rules

- Stack: MERN. Backend: Node.js, Express, Mongoose, JWT. Frontend: React (Vite), Tailwind CSS, React Router, Axios.
- Use plain JavaScript (ES modules), not TypeScript.
- Backend layout: routes -> controllers -> models. Business rules live in services/.
- The rule-based Next-Action Engine lives in server/src/services/actionEngine.js as pure functions (data in, list of actions out). No DB calls inside rule functions.
- Every API route except register and login requires JWT auth, and every query must be filtered by the logged-in user's id.
- Use async/await and a central error handler. Return JSON like { success, data, message }.
- Never hardcode secrets. Use .env and keep .env.example updated.
- Keep code simple and commented so a first-year MCA student can explain it in a viva.
- Work on one feature at a time. After each task, tell me what files changed and how to test it.

## Backend design rules

- Load environment variables only through server/src/config/env.js. Import it first in app.js; never call dotenv.config() anywhere else.
- Shared validation patterns, statuses, and currency lists live in server/src/utils/validation.js. Models and controllers must both import them instead of redefining regexes or enums.
- Controllers stay thin: read the request, call a service or model, return a response. Multi-step business rules belong in server/src/services/.
- Wrap every async controller with asyncHandler from server/src/utils/asyncHandler.js and return responses with sendSuccess / sendCreated / sendError from server/src/utils/apiResponse.js.
- Throw errors with httpError(message, statusCode) and let the central error handler format them. Never send a raw Mongoose error.
- Every planner-owned collection stores a required userId, and every query filters by req.user._id. Verify ownership of related records (client, vendor, event) before writing relationships.
- A planner cannot be deleted while owned records exist; return 409 with a helpful count instead of orphaning data.
- Phone numbers are normalized to E.164 (+ and 8-15 digits) before saving. Email is optional for clients but validated when present.
- An event always requires a start date. Drop all lead-capture-without-date flows.
- Uploaded files go through server/src/services/storageService.js. Store only relative paths in MongoDB, validate file type by extension, MIME type, and magic bytes, and cap uploads at 2 MB.
- Add tests for every new endpoint in server/tests/ using node:test + supertest + mongodb-memory-server. `npm test` must pass before a phase is called done.
- New collections and routes are announced in server/API.md (tracked) and in README.md. The /docs/ folder is local-only and gitignored.

## Token efficiency rules

- If graphify-out/GRAPH_REPORT.md exists, read it before searching raw files.
- Only open the files needed for the current task. Do not scan the whole repo.
- Do not re-read files you just wrote in this session.
- Keep answers short: list changed files and test steps, not long explanations.
- One feature per task. Do not refactor unrelated code.
- Do not print large files or logs in full. Show only the relevant lines.
- After finishing a feature, remind me to commit and rebuild the graph if many files changed.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Frontend rules (client/)

Read `client/README.md` before touching anything under `client/`. It is the source of truth for tokens, primitives, routes and conventions.

- Rebuild lives on branch `frontend-v2`. Do not merge to `main` until `npm run build` and the manual walkthrough pass.
- Use plain JSX, React 18, Vite, Tailwind 3 and React Router 6. No TypeScript, no Tailwind 4 migration in this rebuild.
- Style only with tokens from `client/tailwind.config.js`. No hardcoded hex, colour, shadow or font stack in a component. Add a token first, then document it in `client/README.md`.
- Reuse `components/ui/` (`Button`, `TextField`, ...). Never copy button/input/badge styles into a page. Add a new primitive when a pattern repeats.
- All HTTP calls go through `client/src/api/`. Pages never import Axios directly. Use `getErrorMessage` for user-facing failures.
- Auth: token key is `eventsync_token`; use `useAuth()` and wrap private routes in `<ProtectedRoute>`.
- Every async screen ships loading, empty, error and success states. No `window.confirm` / `window.alert`.
- Mobile first: verify 390, 768 and 1440 with no horizontal scroll. Keep touch targets at least 44px.
- Icons come from `lucide-react` or the authored `BrandMark`; never emoji.
- Keep pages under roughly 250 lines and split sections into components. One feature per task.
- Update `client/README.md` whenever you add a route, token or shared primitive, then run `npm run build`.
- Installed skills live in `.opencode/skills/`. See `.opencode/skills/README.md` for sources and what was vendored.
