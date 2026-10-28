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
