# CLAUDE.md — Web Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui frontend for OmniMarkIt.

## Quick Start

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

---

## App Router Structure

```
web/app/
├── (public)/           # No auth required: landing, tutor search, profiles, auth
│   ├── page.tsx        # P1 Landing / Hero
│   ├── tutors/         # P2 Tutor search, P3 Tutor profile (public)
│   ├── trust-safety/   # P6 Trust & Safety
│   └── ...
├── (auth)/             # P4 Login/Register, P5 Forgot/Reset password
│   ├── login/
│   └── register/
├── (app)/              # Authenticated portal — student + tutor
│   ├── dashboard/      # S1 Student dashboard / T1 Tutor dashboard
│   ├── sessions/       # S4–S7 booking, payment, session room
│   ├── messages/       # S8 Messaging inbox
│   ├── billing/        # S10 Billing & plans
│   ├── settings/       # S11 Profile settings
│   └── ...
└── admin/              # A1–A7 Admin dashboard
    ├── page.tsx
    ├── verification/
    ├── disputes/
    └── users/
```

---

## Server Components vs Client Components

Default is Server Component. Add `'use client'` **only** when you need:
- `useState` / `useReducer`
- `useEffect`
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)
- Third-party client-only libraries

```tsx
// ✅ Server Component (default) — no directive needed
// Fetches data server-side, rendered as HTML
async function TutorSearch({ searchParams }) {
  const tutors = await getTutors(searchParams)  // direct DB/API call
  return <TutorGrid tutors={tutors} />
}

// ✅ Client Component — add directive when interactivity needed
'use client'
import { useState } from 'react'

function FilterPanel({ onFilterChange }) {
  const [subject, setSubject] = useState('all')
  return <select onChange={e => { setSubject(e.target.value); onFilterChange(e.target.value) }}>...</select>
}
```

---

## TanStack Query Patterns

Use for **all client-side server state** — never raw fetch in components.

```tsx
// Querying
import { useQuery } from '@tanstack/react-query'

function StudentDashboard() {
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', 'student'],
    queryFn: () => api.getSessions(),
    staleTime: 30_000,
  })

  if (isLoading) return <DashboardSkeleton />
  if (error) return <ErrorMessage error={error} />
  return <SessionList sessions={sessions} />
}

// Mutating
import { useMutation, useQueryClient } from '@tanstack/react-query'

function BookSession() {
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: api.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
  return <button onClick={() => mutate(data)} disabled={isPending}>Book</button>
}
```

**Query key convention**: `['resource', 'qualifier', id]` e.g. `['sessions', 'student']`, `['tutor', tutorId]`

---

## Zustand Store Patterns

Use for **client-only UI state** — not server data (that's TanStack Query's job).

```tsx
// store/ui.ts
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeFilters: Record<string, string>
  setFilter: (key: string, value: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeFilters: {},
  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value }
  })),
}))

// In component
const { sidebarOpen, setSidebarOpen } = useUIStore()
```

---

## shadcn/ui Conventions

Always check if a shadcn/ui component exists before writing custom:

```tsx
// ✅ Use shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

// Use cn() for conditional classes
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## Tailwind Conventions

```tsx
// ✅ Mobile-first responsive
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3">

// ✅ Use design tokens from OmniMarkIt palette (configure in tailwind.config.ts)
<div className="bg-navy text-cream border-gold">

// ❌ Never inline styles
<div style={{ backgroundColor: '#05102E' }}>  // wrong

// ✅ Class ordering: layout → spacing → colors → typography → states
<div className="flex items-center gap-4 px-6 py-4 bg-white text-sm font-medium hover:bg-gray-50">
```

---

## TypeScript Rules

```tsx
// ✅ Import shared types from packages/shared — never redefine
import type { UserRole, SessionStatus, TutorProfile } from '@omnimarkit/shared'

// ❌ Never use 'any'
const data: any = await fetch(...)  // wrong

// ✅ Type your API responses
const data: TutorProfile = await api.getTutor(id)

// ✅ Type component props
interface SessionCardProps {
  session: SessionRead
  onCancel?: (id: string) => void
}
```

---

## Data Fetching Pattern

| Scenario | Approach |
|----------|----------|
| Public page, SEO needed | Server Component + direct API call |
| Authenticated page, initial data | Server Component, pass as props |
| Client interactions, real-time updates | TanStack Query (`useQuery`) |
| Form submissions | TanStack Query (`useMutation`) |

---

## Persona-Based Routing & Auth

```tsx
// middleware.ts — runs on every request
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  const isAppRoute = request.nextUrl.pathname.startsWith('/(app)')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  if ((isAppRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  // Role check for admin
  if (isAdminRoute) {
    const payload = verifyToken(token)
    if (payload.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

---

## Common Pitfalls

- **Hydration mismatch**: Never access `window`, `localStorage`, or `Date` in SSR context — wrap in `useEffect` or check `typeof window !== 'undefined'`
- **TanStack stale closures**: Always include all dependencies in `queryKey` — if a filter changes, the key must change too
- **Zustand subscriptions**: Use selectors to avoid unnecessary re-renders: `useUIStore(s => s.sidebarOpen)` not `useUIStore()`
- **shadcn/ui imports**: Import from `@/components/ui/`, not from the npm package directly
- **Server Component async**: Server Components can be `async` — use `await` directly, no `useEffect` needed
- **`'use client'` bubbling**: Adding it to a parent makes all children client-side — keep client boundary as deep as possible

---

## Quick Reference

| Task | Command / Pattern |
|------|-------------------|
| Start dev | `npm run dev` |
| Build | `npm run build` |
| Type check | `npx tsc --noEmit` |
| Add shadcn component | `npx shadcn@latest add <component>` |
| New page | Create `app/(group)/route/page.tsx` |
| Server data fetch | `async function` in Server Component |
| Client data fetch | `useQuery({ queryKey, queryFn })` |
| Client mutation | `useMutation({ mutationFn, onSuccess })` |
