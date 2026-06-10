# PRIME TALENT STREAM — TEAM CANVAS
> **For:** Senior Dev · Architect · Designer · Director  
> **Date:** 2026-05-14  
> **Status:** Active Development — Prototype → Production

---

## ⚡ TL;DR — ONE PARAGRAPH

We have a **polished React/TypeScript frontend** with a fully working UI: live recruitment board, admin dashboard, and analytics reports. The visual layer is production-quality. **The problem:** everything runs on localStorage — there's no real database, no real auth, and data disappears on deploy. We need to wire in Supabase (already scaffolded), connect real auth, and migrate all CRUD to the database. After that, we have several product features on deck. The house is built. We need to turn on the electricity.

---

## 🗺️ WHAT WE HAVE — THE MAP

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIME TALENT STREAM                      │
│                                                             │
│  /auth      →  Login / Sign Up                              │
│  /board     →  Live Recruitment Board  (PUBLIC VIEW)        │
│  /admin     →  Recruiter Dashboard     (CRUD)               │
│  /reports   →  Analytics & Reports     (METRICS)            │
└─────────────────────────────────────────────────────────────┘
```

### TECH STACK AT A GLANCE

| Layer | Tool | Status |
|---|---|---|
| Framework | React 18 + TypeScript | ✅ Working |
| Build | Vite + Tailwind | ✅ Working |
| UI | shadcn/ui + Radix | ✅ Working |
| Routing | React Router v6 | ✅ Working |
| Forms | React Hook Form + Zod | ✅ Working |
| Charts | Recharts | ✅ Working |
| Backend | Supabase (Postgres + Auth) | ⚠️ Scaffolded, NOT connected |
| State (Server) | React Query v5 | ⚠️ Installed, NOT used |
| Auth | localStorage mock | ❌ Fake — needs real auth |
| Data | localStorage mock | ❌ Fake — data is ephemeral |

---

## 🟢 WHAT'S DONE — THE WINS

### 1. LIVE BOARD (`/board`)
- Groups jobs by **Role Family** (smart regex classification)
- Real-time **search** across role, tech stack, client, location, BU
- **TV mode** — auto-rotating carousel for office screens
- **Top Candidates** strip per role family
- Priority color coding (ASAP=red, P1=orange, P2=amber, P3=gray)
- Card **flip animation** (front: job details / back: project context)
- Job age indicator (fresh=green, stale=red)

### 2. ADMIN DASHBOARD (`/admin`)
- **Full CRUD** for Jobs and Candidates
- Tabbed view: Jobs | Candidates
- Filter by Business Unit
- Status workflow: open → on_hold → closed
- Notes viewing modal
- Mock data reset button (dev tool)

### 3. REPORTS (`/reports`)
- Monthly opened/closed tracking
- **Win rate** per Business Unit
- Time-to-close metrics
- Role family strength/gap analysis
- Technology stack analysis

### 4. DATA MODELS (Already Defined)
```
Business Unit → Jobs → Top Candidates
                  ↓
            Supabase Tables Exist:
            - business_units
            - jobs
            - top_candidates
            - profiles
            - user_roles (admin | recruiter)
```

---

## 🔴 WHAT'S MISSING — THE GAPS

### GAP 1 — REAL AUTH  `[CRITICAL]`
```
NOW:     Email → localStorage session (no password validation)
NEED:    Email + Password → Supabase Auth → JWT session
IMPACT:  Without this, anyone can "log in" as anyone
```

### GAP 2 — REAL DATABASE  `[CRITICAL]`
```
NOW:     All data lives in localStorage → dies on refresh/deploy
NEED:    Supabase CRUD (React Query mutations + queries)
IMPACT:  Every feature is fake until this is done
```

### GAP 3 — REACT QUERY WIRED UP  `[CRITICAL — depends on GAP 2]`
```
NOW:     QueryClient initialized but zero queries/mutations exist
NEED:    Replace all localData.ts calls with Supabase + RQ hooks
IMPACT:  No real-time sync, no cache invalidation, no optimistic UI
```

### GAP 4 — ROLE MANAGEMENT  `[IMPORTANT]`
```
NOW:     All users = recruiter by default, admin role unused
NEED:    Admin UI to assign roles, admin-only routes/actions
IMPACT:  No access control, anyone can delete anything
```

### GAP 5 — KEYWORK INTEGRATION  `[IMPORTANT]`
```
NOW:     keywork_url field exists on Job and Candidate models
NEED:    Link to Keywork job board, possibly import/sync
IMPACT:  Manual double-entry of data
```

### GAP 6 — FORM VALIDATION  `[NICE TO HAVE]`
```
NOW:     Zod schemas defined but not fully enforced on submit
NEED:    Hook up Zod resolvers, error messages, field validation
IMPACT:  Bad data can enter the system
```

---

## 🎯 OBJECTIVES — WHAT WE'RE BUILDING TOWARD

> **Director's north star:** A live, persistent recruitment command center visible to the whole team, with a TV board for the office, data that doesn't disappear, and recruiters who can manage everything without touching code.

### OBJ-1: Production-Ready Platform
A deployed app where data persists, auth is real, and the team can use it daily.

### OBJ-2: Recruiter Autonomy
Recruiters can add/edit jobs and candidates. Admins can manage users and BUs. No dev needed for day-to-day ops.

### OBJ-3: Live Office Board
TV mode running in the office showing real-time job openings and top candidates — always up to date.

### OBJ-4: Keywork Bridge
Reduce manual data entry by connecting to Keywork where jobs already live.

### OBJ-5: Smarter Reports
Move from static snapshots to live dashboards recruiters can filter by date range, BU, and role family.

---

## 📋 WORK BREAKDOWN — SPRINT PLAN

### PHASE 1 — FOUNDATION  `[DO THIS FIRST — BLOCKS EVERYTHING]`

| # | Task | Owner | Complexity |
|---|---|---|---|
| 1.1 | Wire Supabase Auth (replace localStorage auth) | Dev | Medium |
| 1.2 | Migrate all CRUD to Supabase (replace localData.ts) | Dev | High |
| 1.3 | Implement React Query hooks for Jobs + Candidates | Dev | Medium |
| 1.4 | Deploy to Vercel (or similar) with env vars | Dev | Low |
| 1.5 | Seed production database with initial data | Dev | Low |

### PHASE 2 — ACCESS CONTROL  `[SECURITY LAYER]`

| # | Task | Owner | Complexity |
|---|---|---|---|
| 2.1 | Build Admin user management UI | Dev | Medium |
| 2.2 | Enforce role-based route guards (admin vs recruiter) | Dev | Low |
| 2.3 | Enforce Zod validation on all forms | Dev | Low |
| 2.4 | Audit Supabase RLS policies | Architect | Medium |

### PHASE 3 — FEATURES  `[PRODUCT VALUE]`

| # | Task | Owner | Complexity |
|---|---|---|---|
| 3.1 | Keywork URL deep-link integration | Dev | Low |
| 3.2 | Keywork import/sync (if API available) | Dev | High |
| 3.3 | Reports — date range filter | Dev | Medium |
| 3.4 | Reports — live data (not snapshots) | Dev | Medium |
| 3.5 | Candidate ↔ Job linking improvements | Dev + Design | Medium |
| 3.6 | Email notifications (Supabase Edge Functions) | Dev | Medium |

### PHASE 4 — POLISH  `[DELIGHT]`

| # | Task | Owner | Complexity |
|---|---|---|---|
| 4.1 | Mobile responsiveness audit | Design | Medium |
| 4.2 | TV mode visual refresh | Design | Low |
| 4.3 | Onboarding flow for new recruiters | Design + Dev | Medium |
| 4.4 | Error states + empty states | Design + Dev | Low |

---

## 🔄 DATA FLOW — HOW IT WORKS TODAY vs TOMORROW

### TODAY (Mock)
```
User Action → React Component → localData.ts → localStorage → CustomEvent → Re-render
```

### TOMORROW (Real)
```
User Action → React Component → React Query Mutation → Supabase API
                                                              ↓
                                                    Postgres (RLS enforced)
                                                              ↓
                                              Cache invalidation → Re-render
```

---

## 🏗️ ARCHITECTURE DECISION LOG

| Decision | Choice | Why |
|---|---|---|
| UI Library | shadcn/ui | Accessible, composable, fully owned |
| Database | Supabase | Postgres + Auth + RLS in one, already set up |
| Server State | React Query | Standard pattern, optimistic UI, caching |
| Routing | React Router v6 | Industry standard, nested routes ready |
| Validation | Zod | Type-safe, colocated with TypeScript models |
| Deployment | Vercel (recommended) | MCP integration available in this toolchain |

---

## 🚦 HEALTH CHECK — RIGHT NOW

| Area | Status | Note |
|---|---|---|
| UI / Design | 🟢 GOOD | Production-quality visual layer |
| Data Models | 🟢 GOOD | Clean types, Supabase schema ready |
| Routing | 🟢 GOOD | All routes work |
| Auth | 🔴 FAKE | localStorage only, no real validation |
| Database | 🔴 FAKE | localStorage, data is ephemeral |
| Deployment | 🔴 NONE | Not deployed |
| Tests | 🟡 PARTIAL | Vitest set up, minimal coverage |
| Role Control | 🔴 NONE | All users have same access |

---

## 🧠 DECISIONS NEEDED FROM THE TEAM

1. **Director:** What's the deadline for Phase 1? Who are the first real users?
2. **Architect:** Confirm RLS policies cover all attack vectors before Phase 2 deploy.
3. **Designer:** Review empty states, error states, and mobile views before Phase 3.
4. **Dev:** Confirm Keywork has a usable API before scheduling Phase 3.2.

---

## 📁 FILE NAVIGATION — WHERE TO FIND THINGS

```
src/
├── pages/           ← Start here for route-level features
│   ├── Index.tsx    ← Live Board
│   ├── Admin.tsx    ← Recruiter Dashboard
│   ├── Reports.tsx  ← Analytics
│   └── Auth.tsx     ← Login/Signup
├── components/
│   ├── JobCard.tsx          ← Job display + flip animation
│   ├── CandidateCard.tsx    ← Candidate profile card
│   ├── JobFormDialog.tsx    ← Job create/edit form
│   └── CandidateFormDialog.tsx
├── lib/
│   ├── localData.ts    ← ⚠️ REPLACE THIS with Supabase
│   ├── jobs.ts         ← Types, enums, constants
│   └── roleFamilies.ts ← Smart role classification
├── hooks/
│   └── useAuth.tsx     ← ⚠️ REPLACE THIS with Supabase auth
└── integrations/
    └── supabase/
        ├── client.ts   ← Supabase client (ready to use)
        └── types.ts    ← DB types (auto-generated)
```

---

*Canvas generated: 2026-05-14 | Next review: after Phase 1 complete*
