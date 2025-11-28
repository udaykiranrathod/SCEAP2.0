# SCEAP2.0
Smart Cable Engineering Automation Platform

## Quick Start (Codespaces)

1. Start the backend server (inside `/workspaces/SCEAP2.0/backend`)

```bash
poetry install  # if running for the first time
poetry run uvicorn main:app --reload --port 8000
```

2. Make port 8000 public in Codespaces `Ports` tab. Copy the forwarded URL (it looks like `https://<id>-8000.app.github.dev`).

3. Configure frontend to use that backend public URL by creating/updating `frontend/.env`:

```bash
cd frontend
cat > .env <<EOF
VITE_API_BASE=https://<id>-8000.app.github.dev
EOF
```

4. Start the frontend (inside `/workspaces/SCEAP2.0/frontend`)

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

5. Make port 5173 public, and open the public forwarded URL. Click `Run Cable Sizing Engine`.

If nothing updates in the UI, open the browser console and verify the `[VITE] VITE_API_BASE` and `[API] Using baseURL:` log lines to confirm the frontend is using the correct backend URL. Also check the network tab request to `/cable/size` and the backend logs.

