# Collaborative Notepad

Collaborative Notepad is a production-ready real-time editor with:

- Frontend: Next.js (App Router)
- Backend: Flask + Flask-SocketIO
- Realtime sync: Socket.IO
- Reverse proxy: Nginx
- Deployment: Docker Compose

## Production Architecture

Browser traffic always terminates at Nginx:

1. `/` goes to Next.js
2. `/api/*` goes to Flask
3. `/socket.io/*` goes to Flask Socket.IO

For split-host deployments (for example Vercel frontend + Render backend), the frontend uses `NEXT_PUBLIC_API_URL` to connect to the backend directly.
If the frontend is served over HTTPS, `NEXT_PUBLIC_API_URL` must also point to an HTTPS backend URL. Browsers block requests from an HTTPS page to an `http://` API as mixed content.

## Run in Production (Docker Compose)

From project root:

```bash
docker compose up -d --build
```

Exposed host ports:

- `80` (HTTP via Nginx)
- `443` (reserved for HTTPS termination at Nginx)

Internal-only services:

- `frontend:3000`
- `backend:8000`

Backend and frontend are not exposed publicly.

## Environment Variables

Frontend (`client`) environment variable:

- `NEXT_PUBLIC_API_URL` (required for Vercel/Render style split deployments)
- Example local value: `http://localhost:8000`
- In local frontend development, create `client/.env.local` from `client/.env.example`
- In Vercel, set `NEXT_PUBLIC_API_URL` in Project Settings -> Environment Variables (instead of uploading a `.env` file)
- In Vercel, use a public HTTPS backend URL, not a raw `http://` IP address

The frontend uses this variable for:

- REST API requests (`${NEXT_PUBLIC_API_URL}/api/...`)
- Socket.IO connection (`${NEXT_PUBLIC_API_URL}/socket.io`)

If `NEXT_PUBLIC_API_URL` is not set, frontend requests fall back to same-origin URLs. This keeps Docker + Nginx proxy deployments working.

Backend supports optional environment variables:

- `SERVER_HOST` (default `0.0.0.0`)
- `SERVER_PORT` (default `8000`)
- `CORS_ORIGINS` (default `*`, set to your Vercel domain in production)

You only need a `.env` file if you want to override backend defaults or add future secrets.

## Security Defaults

- Non-root user in frontend and backend containers
- `no-new-privileges` in Compose services
- Minimal base images (`node:alpine`, `python:slim`, `nginx:alpine`)
- Internal bridge network between services
- Only Nginx publishes ports
- Healthchecks for `frontend`, `backend`, and `nginx`

## Project Structure

```text
.
├─ client/
│  ├─ Dockerfile
│  ├─ .dockerignore
│  └─ ...
├─ server/
│  ├─ Dockerfile
│  ├─ .dockerignore
│  └─ app.py
├─ docker-compose.yml
├─ nginx.conf
```

## Local Development (Without Docker)

Backend:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
python server/app.py
```

Frontend:

```bash
cd client
npm install
# Windows PowerShell:
copy .env.example .env.local
# macOS/Linux:
# cp .env.example .env.local
npm run dev
```

For local development, Next.js runs on `3000` and Flask on `8000`.

## Notes

- Backend entrypoint: [server/app.py](server/app.py)
- Frontend room page: [client/app/room/[roomId]/page.tsx](client/app/room/[roomId]/page.tsx)
- Production proxy config: [nginx.conf](nginx.conf)
