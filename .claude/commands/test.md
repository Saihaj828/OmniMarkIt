---
description: Run backend, frontend, and mobile tests with reporting
---

Run the full test suite across all layers:

1. **Backend tests** (pytest):
```bash
cd backend && source .venv/bin/activate && pytest tests/ -v --tb=short
```

2. **Frontend tests** (Next.js):
```bash
cd web && npm test
```

3. **Mobile tests** (Expo/Jest):
```bash
cd mobile && npx jest
```

4. **E2E with Playwright** (use `mcp__playwright__*` tools against http://localhost:3000)

Report: total pass/fail, coverage if available, linting issues, next steps.
If no tests exist for a layer, offer to scaffold the test suite for it.
