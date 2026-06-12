# CLAUDE.md — Shared Package

TypeScript types, schemas, and constants shared between `web/` and `mobile/`.

## What Belongs Here

Add something here **only if both web AND mobile need it**:

- **TypeScript interfaces/types** — all 28 DB table DTOs (request/response shapes matching Pydantic schemas)
- **Enums & constants** — `UserRole`, `SessionStatus`, `PaymentStatus`, `TutorVettingStatus`, billing plan names, error codes
- **Zod schemas** — validation schemas used for forms on both platforms
- **Utility functions** — pure functions with no framework dependencies (date formatting, currency formatting, string utils)

## What Does NOT Belong Here

- React hooks (`useState`, `useQuery`, etc.) — web-only → `web/lib/hooks/`
- React Native components — mobile-only → `mobile/components/`
- Next.js-specific code (`server-only`, `headers()`, etc.)
- Expo-specific APIs (`SecureStore`, `expo-router`)
- Any import that requires a framework

## Import Convention

```ts
// tsconfig.json paths alias (configured in both web and mobile)
{
  "paths": { "@omnimarkit/shared": ["../packages/shared/src/index.ts"] }
}

// Usage in web or mobile
import type { TutorProfile, SessionStatus } from '@omnimarkit/shared'
import { sessionCreateSchema, formatCurrency } from '@omnimarkit/shared'
```

## Package Structure

```
packages/shared/src/
├── index.ts            # Re-exports everything
├── types/
│   ├── auth.ts         # User, StudentProfile, TutorProfile DTOs
│   ├── sessions.ts     # Session, SessionCreate, SessionRead
│   ├── payments.ts     # Payment, Subscription, BillingPlan
│   └── ...             # One file per domain (mirrors backend schemas/)
├── enums.ts            # UserRole, SessionStatus, TutorVettingStatus, etc.
├── constants.ts        # BILLING_PLANS, SESSION_DURATIONS, ERROR_CODES
├── schemas/            # Zod validation schemas
│   ├── session.ts
│   └── booking.ts
└── utils/
    ├── currency.ts     # formatCents(cents: number): string
    └── dates.ts        # formatUTC, formatDuration
```

## Example Types

```ts
// types/auth.ts
export interface TutorProfile {
  id: string              // UUID
  userId: string
  displayName: string
  avgRating: number       // Read cached — never compute
  totalSessions: number   // Read cached — never compute
  hourlyRateCents: number // Always cents, never dollars
  subjects: Subject[]
  vettingStatus: TutorVettingStatus
}

// enums.ts
export type UserRole = 'student' | 'tutor' | 'admin'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TutorVettingStatus = 'pending' | 'in_review' | 'approved' | 'rejected'
```

## Currency Utility (Required Pattern)

```ts
// utils/currency.ts
// Backend stores cents; display layer converts to dollars
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(cents / 100)
}
// formatCents(4500) → "$45.00"
```

## Decision Rule

Before adding to `packages/shared/`, ask:
1. Does web need it? ✅
2. Does mobile need it? ✅
3. Is it framework-agnostic (no React, no RN, no Next, no Expo)? ✅

All three must be true. If not — put it in the module that needs it.
