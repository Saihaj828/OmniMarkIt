---
description: Start web frontend, backend API, and optionally mobile
---

Kill any existing servers on the dev ports, then start backend and frontend.

**Backend (FastAPI on port 8000):**
```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

**Web Frontend (Next.js on port 3000):**
```bash
cd web && npm run dev
```

**Mobile (Expo):**
```bash
cd mobile && npx expo start
```

Kill existing processes first:
```bash
lsof -ti:8000,3000 | xargs kill -9 2>/dev/null || true
```

After starting, verify:
- Backend API: http://localhost:8000/docs
- Web: http://localhost:3000
- Mobile: scan QR code in Expo Go
