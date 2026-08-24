@AGENTS.md

# TeamCompDiff Client — Project Reference

## Overview
League of Legends team composition analysis app. Users configure up to 5 player slots (roles + champion pools), run an AI algorithm, and get ranked team comp suggestions with synergy analysis.

**Stack**: Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Redux Toolkit + RTK Query · AWS Amplify v6 auth · Lucide React icons · Oxanium font (branding only)

**Path alias**: `@/*` → `src/*`

---

## Styling System

### Dark / Light Theme
- `isDarkMode` lives in Redux: `useAppSelector((s: any) => s.global?.isDarkMode ?? false)`
- Convention throughout: `const dm = isDarkMode` then conditionally apply styles
- **Dark**: inline styles with `#0d0d14` backgrounds and `rgba(255,255,255,…)` text
- **Light**: Tailwind CSS variable classes (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-accent`, etc.)
- Toggle dispatches `setIsDarkMode(!isDarkMode)` from `src/state/index.ts`

### Pattern Example
```tsx
<div
  className={`rounded-xl ${dm ? "" : "bg-card border border-border"}`}
  style={dm ? { background: "#0d0d14", border: "1px solid rgba(255,255,255,0.07)" } : undefined}
>
  <span
    className={dm ? "" : "text-muted-foreground"}
    style={dm ? { color: "rgba(255,255,255,0.4)" } : undefined}
  >
    label
  </span>
</div>
```

### Color Palette (dark mode)
| Use | Value |
|-----|-------|
| Page/sidebar bg | `#0d0d14` |
| Card bg | `rgba(255,255,255,0.04)` |
| Borders | `rgba(255,255,255,0.07)` |
| Primary text | `rgba(255,255,255,0.85–0.95)` |
| Secondary text | `rgba(255,255,255,0.4–0.6)` |
| Accent purple | `rgba(139,92,246,…)` (primary) |
| Purple glow | `rgba(139,92,246,0.35–0.45)` |
| Purple button | `linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,60,220,1) 100%)` |

### Tailwind v4 Canonical Classes
- `aspect-3/4` (not `aspect-[3/4]`)
- `bg-linear-to-t` (not `bg-gradient-to-t`)
- `min-h-11` (not `min-h-[2.75rem]`)

---

## Role System (`src/lib/riot/types.ts`)

```typescript
type Role = "top" | "jungle" | "mid" | "adc" | "support" | "fill"
const ALL_ROLES: Role[] = ["top", "jungle", "mid", "adc", "support"]  // fill excluded
const ROLE_LABELS: Record<Role, string>
```

**Important**: `fill` is NOT in `ALL_ROLES` because that array is used for champion role filtering. Add fill separately where needed: `[...ALL_ROLES, "fill"] as Role[]`.

When `primaryRole === "fill"`, secondary role selection is hidden.

### Role Icon URLs (Community Dragon)
```
const CDRAG = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions"
// Icons: icon-position-top.png, icon-position-jungle.png, icon-position-middle.png,
//        icon-position-bottom.png, icon-position-utility.png, icon-position-fill.png
```

### Role Colors (rgb for rgba building)
```
top: "239,68,68" | jungle: "34,197,94" | mid: "139,92,246"
adc: "245,158,11" | support: "59,130,246" | fill: "255,255,255"
```

---

## Champion Images (DDragon)

```
// Square icon (champion select grid)
https://ddragon.leagueoflegends.com/cdn/16.16.1/img/champion/{id}.png

// Portrait / loading screen art (308×560, use object-top)
https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{id}_0.jpg
```

Champion `id` ≠ `name` (e.g., `AurelionSol` not `Aurelion Sol`). Build a `name→id` map from `champData.data`.

**Champion data source**: Champion metadata (names, roles, ids) is fetched from the backend via `GET /champions` (`useGetChampionsQuery()`), not directly from DDragon. The backend returns `{ data: Record<string, ChampionData> }` where each entry includes `name`, `roles`, and DDragon `id` for image lookups. DDragon is only used for images — never as a data source directly from the client.

DDragon sprite sheet `x`/`y` values are tile coordinates for the sprite sheet only — NOT positional data for splash art.

---

## State Management

### Global Slice (`src/state/index.ts`)
```typescript
{ isSidebarCollapsed: boolean, isDarkMode: boolean }
// Actions: setIsSidebarCollapsed, setIsDarkMode
```

### Team Slice (`src/state/teamSlice.ts`)
```typescript
{
  slots: SummonerSlot[],        // 5 slots
  myRiotId: string | null,
  champions: Record<string, ChampionData>,   // not persisted
  matches: Record<string, MatchData>,         // not persisted
  queueFilter: "all" | "ranked" | "draft" | "clash",
  numTeammates: number
}

// SummonerSlot key fields:
{ slotIndex, gameName, tagLine, primaryRole?, secondaryRole?, slotChampPool: string[], loaded, error? }

// Key actions:
setSummonerData({ slotIndex, data })
clearSlot(slotIndex)
setSlotRole({ slotIndex, role: Role | undefined })
setSlotSecondaryRole({ slotIndex, role: Role | undefined })
setSlotChampPool({ slotIndex, pool: string[] })
setMyRiotId(riotId)
loadQueryPlayers(PlayerInput[])
setChampions(Record)
```

---

## API (`src/state/api.ts`)

Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL`  
Auth: AWS Amplify Cognito bearer token (auto-injected)  
Tag Types: `["Profile", "Comps", "Queries"]`

### Queries
| Hook | Endpoint | Notes |
|------|----------|-------|
| `useGetAuthUserQuery(undefined)` | Cognito identity | arg must be `undefined`, not `{}` |
| `useGetChampionsQuery()` | GET /champions | public, no auth — **champion data comes from the backend, not DDragon directly** |
| `useGetProfileQuery()` | GET /profile | provides "Profile" |
| `useGetCompsQuery()` | GET /comps | provides "Comps" |
| `useGetQueriesQuery()` | GET /queries | provides "Queries" |

### Mutations
| Hook | Endpoint | Invalidates |
|------|----------|-------------|
| `useUpdateProfileMutation()` | PUT /profile | "Profile" |
| `useLinkRiotAccountMutation()` | POST /players/link-riot | — |
| `useRefreshCacheMutation()` | POST /players/refresh-cache | — |
| `useRunTeamCompMutation()` | POST /team-comp | — |
| `useSaveCompMutation()` | POST /comps | "Comps" |
| `useDeleteCompMutation()` | DELETE /comps/:id | "Comps" |
| `useCreateQueryMutation()` | POST /queries | "Queries" |
| `useUpdateQueryMutation()` | PUT /queries/:id | "Queries" |
| `useDeleteQueryMutation()` | DELETE /queries/:id | "Queries" |
| `useRunQueryMutation()` | POST /queries/:id/run | "Queries" |

### Key Types
```typescript
PlayerInput { primaryRole: Role, secondaryRole?: Role, champPool?: string[], riotId?: string }
UserProfile { champPool: string[], preferredRole: Role|null, preferredSecondaryRole: Role|null, displayName: string|null }
GeneratedComp { archetype, description, roleAssignment, picks: CompPick[], analysis: CompAnalysis, cacheAgesAt }
CompAnalysis { difficulty, winConditions, powerSpike, synergies, suggestedPlaystyle, engage }
SavedComp { compId, compName, comp: GeneratedComp, createdAt, queryId? }
SavedQuery { queryId, queryName, players: PlayerInput[], lastRunAt?, results? }
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Team Generator page — slots, run algorithm, save comp/query, results |
| `src/app/comps/page.tsx` | Saved comps page |
| `src/app/draft/page.tsx` | Draft page |
| `src/app/scouting/page.tsx` | Opponent scouting page |
| `src/app/profile/page.tsx` | User profile page |
| `src/components/Team/SummonerCard.tsx` | Slot card + `SlotConfigModal` + `RoleIconRow` |
| `src/components/ChampionPicker/index.tsx` | Champion selection modal |
| `src/components/Sidebar/index.tsx` | Navigation sidebar |
| `src/components/Navbar/index.tsx` | Top navigation bar |
| `src/state/api.ts` | All RTK Query endpoints |
| `src/state/teamSlice.ts` | Team composition Redux slice |
| `src/state/index.ts` | Global UI Redux slice |
| `src/lib/riot/types.ts` | Role types, region types, Riot API shapes |

---

## UX Conventions

- **Valid slot**: must have `primaryRole` AND `slotChampPool.length > 0` to count toward generation
- **Toast notifications**: green pill, bottom-right, `z-50`, auto-dismiss 3s — trigger with `showToast(msg)` in page.tsx
- **Save as query**: button hidden after save until slots change (`JSON.stringify(slots) !== lastSavedSlotsJson`)
- **Disable during save**: `disabled` prop + `disabled:opacity-50 disabled:cursor-not-allowed`, button text changes to "Saving…"
- **Sidebar nav text**: `text-sm font-medium` (bumped from xs for readability)
- **Oxanium font**: branding/headings only — import per-component via `next/font/google`
- **Windows scrollbar fix**: sidebar uses `overflow-x-hidden` on outer + `w-full` on inner divs (scrollbars take ~17px)

---

## AWS Amplify Notes
- Auth: `signOut()` from `aws-amplify/auth`
- `useGetAuthUserQuery(undefined)` — the arg MUST be `undefined` (not `{}`) — the endpoint expects `void`
- Display name: `currentUser?.user?.username` — there is no `userDetails` property
