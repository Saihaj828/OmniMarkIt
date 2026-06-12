# CLAUDE.md — Mobile

Expo (React Native) + TypeScript mobile app for OmniMarkIt.

## Quick Start

```bash
cd mobile
npm install
npx expo start          # Opens Expo Go QR code
npx expo start --ios    # iOS simulator
npx expo start --android  # Android emulator
```

---

## Expo Router Structure (File-based Routing)

```
mobile/app/
├── (auth)/             # Unauthenticated screens
│   ├── login.tsx       # M-equiv of P4 Auth Login
│   └── register.tsx
├── (tabs)/             # Main tab navigation (after login)
│   ├── _layout.tsx     # Tab bar config
│   ├── index.tsx       # M2 Mobile Home
│   ├── browse.tsx      # M5 Browse tutors
│   ├── messages.tsx    # M4 Messages
│   └── profile.tsx     # M6 Profile
└── sessions/
    └── [id].tsx        # M3 Session room
```

---

## Expo Router Navigation

```tsx
import { router, useLocalSearchParams, Link } from 'expo-router'

// Programmatic navigation
router.push('/sessions/abc-123')
router.replace('/(auth)/login')   // replace current history entry
router.back()

// URL params in dynamic routes
function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // ...
}

// Declarative navigation
<Link href="/browse">Browse Tutors</Link>
```

---

## React Native vs Web Patterns

```tsx
// ✅ StyleSheet — no CSS classes, no Tailwind
import { StyleSheet, View, Text, Pressable } from 'react-native'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05102E', padding: 16 },
  title: { fontFamily: 'Serif', fontSize: 24, color: '#FFF2C2' },
  button: { backgroundColor: '#C49A2A', borderRadius: 8, padding: 12 },
})

// ✅ Platform checks
import { Platform } from 'react-native'
const shadowStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  android: { elevation: 4 },
})

// ✅ Pressable (not div with onClick)
<Pressable onPress={() => router.push('/sessions')}
           style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
  <Text style={styles.buttonText}>View Session</Text>
</Pressable>
```

---

## Shared Types from packages/shared/

```tsx
// Import shared TypeScript types — never redefine them
import type { TutorProfile, SessionStatus, UserRole } from '@omnimarkit/shared'

// Use shared Zod schemas for form validation
import { sessionCreateSchema } from '@omnimarkit/shared/schemas'
```

---

## Data Fetching (TanStack Query — same as web)

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

function BrowseScreen() {
  const { data: tutors, isLoading } = useQuery({
    queryKey: ['tutors', filters],
    queryFn: () => api.searchTutors(filters),
  })

  if (isLoading) return <ActivityIndicator />
  return <FlatList data={tutors} renderItem={({ item }) => <TutorCard tutor={item} />} />
}
```

---

## Auth — Token Storage

```tsx
// ✅ SecureStore for tokens — NOT AsyncStorage (unencrypted)
import * as SecureStore from 'expo-secure-store'

await SecureStore.setItemAsync('auth_token', token)
const token = await SecureStore.getItemAsync('auth_token')
await SecureStore.deleteItemAsync('auth_token')  // on logout
```

---

## Common Pitfalls

- **Metro bundler cache**: if you see stale code, run `npx expo start --clear`
- **Platform styling**: `flexDirection` defaults to `column` in RN (not `row` like web CSS)
- **No `px` units**: RN uses unitless numbers (`padding: 16` not `padding: '16px'`)
- **Images**: Use `expo-image` not the built-in `<Image>` — better caching and performance
- **Fonts**: Load with `useFonts` from `expo-font` before rendering text
- **Keyboard avoiding**: Wrap forms in `KeyboardAvoidingView` on iOS
- **Safe area**: Use `SafeAreaView` or `useSafeAreaInsets` for notch/island devices

---

## Quick Reference

| Task | Command |
|------|---------|
| Start (Expo Go) | `npx expo start` |
| iOS simulator | `npx expo start --ios` |
| Android emulator | `npx expo start --android` |
| Clear Metro cache | `npx expo start --clear` |
| Build preview APK | `npx eas build --profile preview --platform android` |
| Run tests | `npx jest` |
| New screen | Create `app/(group)/screen-name.tsx` |
