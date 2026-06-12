---
description: Stop all dev servers
---

Find and stop processes on all dev ports (3000, 8000).

```bash
lsof -ti:3000,8000 | xargs kill 2>/dev/null || true
```
