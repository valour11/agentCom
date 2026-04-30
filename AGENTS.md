# AGENTS.md — agentCom

> Multi-Agent WhatsApp CRM. Express + MongoDB backend, React + Vite + Tailwind v4 frontend.

## Commands

| Action | Command |
|---|---|
| **Backend dev** | `cd backend && npm run dev` (nodemon, port **5000**) |
| **Frontend dev** | `cd frontend && npm run dev` (Vite, port **5173**) |
| **Frontend lint** | `cd frontend && npm run lint` |
| **Frontend build** | `cd frontend && npm run build` |
| **Create first admin** | `cd backend && node scripts/setupAdmin.js` (creates `SuperAdmin` / `admin123`) |
| **WhatsApp webhook tunnel** | `cloudflared tunnel --url http://localhost:5000` → use `.trycloudflare.com` URL + `/api/webhook/whatsapp` in Meta |

No test suite is configured (`npm test` exits with error in both packages).

## Architecture

### Backend (`backend/`) — ESM (`"type": "module"`)
- **Entry**: `server.js` — Express + Socket.io on a single HTTP server. `io` is injected into `req` via middleware.
- **Database**: MongoDB via Mongoose, hardcoded DB name `whatsapp` (`config/db.js`).
- **Auth**: JWT Bearer tokens. Middleware in `middleware/auth.middleware.js` — `protect` (auth required) and `authorize(...roles)` (role check).
- **Routes**:
  - `POST /api/webhook/whatsapp` — Meta WhatsApp webhook (GET for verification, POST for incoming messages)
  - `POST /api/auth/*` — login/register
  - `POST /api/admin/*` — admin-only endpoints
  - `/api/test/*` — test routes
- **Socket.io events**: `join_conversation`, `NEW_MESSAGE`, `NEW_CONVERSATION`. CORS is `*` (open).
- **WhatsApp service**: `services/whatsapp.service.js` — calls Meta Graph API directly (no third-party WhatsApp library).

### Frontend (`frontend/`)
- **Entry**: `src/main.jsx` → `App.jsx`
- **Router**: `react-router-dom` v7. Routes: `/` → Login, `/dashboard` → Dashboard (protected).
- **Auth context**: `src/contexts/AuthContext.jsx` — stores agent session.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. No custom CSS framework.

## Env Vars (`backend/.env`)

Required for backend to start: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`, `GRAPH_API_URL`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, `VERIFY_TOKEN`.

⚠️ **`backend/.env` contains live credentials**. Never commit changes to this file.

## Conventions / Quirks

- **ESM throughout**: All `import` statements must use `.js` extensions. No `require()`.
- **No TypeScript**: Both packages are plain JavaScript.
- **No ORM migration tool**: Mongoose models are in `backend/models/`. Schema changes are manual — update the `.js` model file.
- **Default password** in `setupAdmin.js` is hardcoded (`admin123`). Change after first run.
- **Socket.io CORS** is wide open (`*`). Restrict for production.
- **Two `.env` blocks** in `backend/.env`: active config on top, commented-out DIGITECH API config below. Only use the active block.

## `.agent/` directory

Contains "Antigravity Kit" — a Gemini AI agent framework (20 agents, 36 skills, workflows, validation scripts). **Not used by this project's application code.** Safe to ignore unless working with Gemini. Rules in `.agent/rules/GEMINI.md` apply only to Gemini sessions.

## Key files reference

| File | Purpose |
|---|---|
| `backend/server.js` | Express + Socket.io entry |
| `backend/config/db.js` | MongoDB connection |
| `backend/models/*.js` | Mongoose schemas (Agent, Contact, Conversation, Message) |
| `backend/middleware/auth.middleware.js` | JWT protect + role authorize |
| `backend/services/whatsapp.service.js` | Meta API call wrapper |
| `backend/routes/whatsapp.routes.js` | Webhook handler |
| `frontend/src/contexts/AuthContext.jsx` | Frontend auth state |
| `docs/whatsapp-setup.md` | Meta developer portal setup guide |
| `SYSTEM-PROMPT.md` | Original build specification (design doc, not source of truth) |
