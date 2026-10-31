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
