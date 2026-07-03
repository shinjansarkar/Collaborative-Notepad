# Collaborative Notepad

Collaborative Notepad is a real-time shared editor with:

- Frontend: Next.js (App Router) in [client](client)
- Backend: Flask + Flask-SocketIO in [server](server)
- Realtime sync: Socket.IO (WebSocket/polling)

## Quick Start

1. Start backend (port 8000)
2. Start frontend (port 3000)
3. Open http://localhost:3000

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- pip
- (Optional) Docker + Docker Compose

## Project Structure

```text
.
├─ client/                 # Next.js frontend
├─ server/                 # Flask + Socket.IO backend
├─ docker-compose.yml      # Docker setup for backend
├─ nginx.conf
└─ README-Docker.md
```

## Run Locally (Frontend + Backend)

### 1. Start the backend

From the project root:

```bash
python -m venv .venv
```

Activate virtual environment:

Windows (PowerShell):

```bash
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r server/requirements.txt
```

Run the backend:

```bash
python server/app.py
```

Backend runs on: http://localhost:8000

### 2. Start the frontend

Open a new terminal from the project root:

```bash
cd client
npm install
```

Create an environment file [client/.env.local](client/.env.local):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend runs on: http://localhost:3000

## Run with Docker (Backend) + Local Frontend

This repository's [docker-compose.yml](docker-compose.yml) currently runs the backend service.

### 1. Start backend in Docker

From the project root:

```bash
docker compose up --build
```

If your system uses the legacy CLI:

```bash
docker-compose up --build
```

Backend will be available at: http://localhost:8000

### 2. Start frontend locally

In another terminal:

```bash
cd client
npm install
npm run dev
```

Make sure [client/.env.local](client/.env.local) contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment (Vercel Frontend + Oracle Backend)

### 1. Restrict backend origins

Set `ALLOWED_ORIGINS` on your Oracle server to only your real frontend domains.

Example:

```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
```

Do not use `*` in production.

### 2. Set frontend API URL on Vercel

In Vercel project settings, set:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3. Put backend behind HTTPS reverse proxy

- Run Flask/Socket.IO on internal port `8000`.
- Terminate TLS at Nginx/Caddy on your Oracle VM.
- Proxy both `/api/*` and Socket.IO traffic to `http://127.0.0.1:8000`.

### 4. Lock down network exposure

- Open only `80/443` publicly.
- Block direct public access to `8000` with your VM firewall/security list.

### 5. Keep secrets out of code

- Store server-side secrets as environment variables only.
- Do not commit `.env` files.

### 6. Keep dependencies updated

- Regularly patch OS packages and Python/Node dependencies.
- Rebuild and redeploy images after security updates.

## Useful Commands

From [client](client):

```bash
npm run dev
npm run build
npm run start
npm run lint
```

From project root (backend tests):

```bash
pytest
```

## Troubleshooting

- Frontend shows connection error:
  - Confirm backend is running on port 8000.
  - Confirm `NEXT_PUBLIC_API_URL` in [client/.env.local](client/.env.local).
  - Restart `npm run dev` after changing env variables.
- Port already in use:
  - Stop the process on port 3000 or 8000, then restart services.
- Socket reconnect issues:
  - Check that both REST API and Socket.IO target the same backend URL.
  - Verify your production domain is included in `ALLOWED_ORIGINS`.

## Notes

- Backend entrypoint: [server/app.py](server/app.py)
- Frontend room page: [client/app/room/[roomId]/page.tsx](client/app/room/[roomId]/page.tsx)
- Docker backend image definition: [server/Dockerfile](server/Dockerfile)

## Contributors

- [Smaranika2005](https://github.com/Smaranika2005)
