# ASTRA CARE — Architecture, User Flow & Design Direction

A fully interactive astronaut health monitoring prototype. Everything clickable does something; anything not yet possible is shown as a clearly labeled "Coming later" disabled control. All sample data, AI outputs and alerts carry a visible **Simulated** badge.

## User flow

```text
/login ──(valid access code)──> /overview
   ^                              │
   │                              ├─ /health ──> /health/:indicator (detail + trend)
   │                              ├─ /body       (3D body explorer)
   │                              ├─ /assessment ──> assessment history item
   │                              ├─ /environment ──> hazard detail
   │                              ├─ /alerts     (notification center)
   │                              └─ /reports ──> /reports/:id
   └────────────(logout, or visiting any inner page while signed out)
```

- Login: code field with show/hide, validation (empty / wrong format / unknown code), loading spinner, success transition, demo codes panel with "use this code" buttons.
- Signed-out visitors to any inner page are sent to /login and returned to where they were going after signing in.
- Header shows the astronaut's avatar/ID, unread alert bell (dropdown), global search (pages, indicators, reports), and logout.

## Pages

1. **Login** — split layout: brand + one-line explanation + a subtle orbital line illustration on one side, access form on the other.
2. **Mission Overview** — astronaut profile & ID, mission card (vehicle, phase, mission day), latest reading for each of the 6 indicators (clickable), hazard summary strip, 5 most recent alerts, quick links. No health scores.
3. **Health Monitoring** — 6 indicator cards (Heart Rate, Blood Pressure, Blood Sugar, Body Temperature, Sleep Hours, Mood). Detail page per indicator: latest value + unit + timestamp, interactive trend chart with 7/14/30-day range tabs, reading table, description, and empty/unavailable states (some astronauts will intentionally have gaps to demonstrate this). No reference ranges.
4. **3D Body Explorer** — real 3D figure you can rotate, zoom and reset; click regions (head, chest/heart, torso, arms, legs) to highlight them; side panel shows related indicators and recent readings for that region, with a note that the model is a visual guide and does not measure anything.
5. **AI Health Assessment** — overview of the latest simulated assessment, per-indicator pattern notes (descriptive only, e.g. "sleep duration varied more this week"), history list with timestamp and source ("Simulated model v0 — not connected"). Plain disclaimer: no diagnoses or treatment advice.
6. **Space Environment** — separate section for Radiation, Isolation & Confinement, Distance from Earth, Gravity Fields, Hostile Closed Environments. Each has a description, a simulated chart where sample data exists, and an honest "No data feed connected" state where it doesn't.
7. **Alerts** — notification center with filters (all / unread / health / environment), search, mark read/unread, mark all read, alert detail drawer.
8. **Reports** — report history with type filter and search, detailed report view, "Export PDF" shown as a disabled future feature.

## Demo astronauts (3, fully separate)

| Code | Astronaut | Mission |
|---|---|---|
| ASTRA-7421-ORN | CDR Lena Okafor (AST-001) | Lunar Gateway rotation |
| ASTRA-3058-LYR | FE Mateo Rinaldi (AST-002) | Low Earth Orbit station |
| ASTRA-9160-VGA | MS Hana Sato (AST-003) | Mars transit analog |

Each has its own readings, gaps, alerts, reports and assessments. Names and codes are fictional demo values (editable later).

## Design direction

- Bright, calm clinical feel with a quiet space touch (thin orbital lines, star-dot texture used sparingly).
- Colors: soft warm-white background, deep teal primary, pale mint surfaces/highlights, subtle coral for alerts and attention. No neon, no dark mode, minimal gradients.
- Type: Bricolage Grotesque for headings, IBM Plex Sans for body, IBM Plex Mono for codes, IDs and readings.
- Cards with ~10px radius, hairline borders, soft shadows; generous spacing; collapsible sidebar on desktop, slide-out menu on tablet/mobile.

## Build stages (each verified before the next)

1. Design system, app shell, login + demo authentication, route protection, logout.
2. Mission Overview + sidebar/header/search/alert bell.
3. Health Monitoring list + indicator detail pages with charts.
4. 3D Body Explorer.
5. AI Assessment, Space Environment, Alerts, Reports.
6. End-to-end check with all three codes (correct data per astronaut, no cross-access), invalid codes, logout, every nav link, 3D interactions, mobile/tablet layouts; plus automated tests for the login and data-separation rules.

## Technical details

- Stack: existing TanStack Start (React 19 + TypeScript + Vite), Tailwind v4 tokens in `src/styles.css`, shadcn components, Lucide icons, Recharts. 3D via `three` + `@react-three/fiber` + `@react-three/drei`, loaded client-only.
- Folders:
  - `src/routes/` — `login.tsx`, `_authenticated.tsx` (guard + shell with `<Outlet/>`), `_authenticated/overview.tsx`, `health.index.tsx`, `health.$indicator.tsx`, `body.tsx`, `assessment.tsx`, `environment.tsx`, `alerts.tsx`, `reports.index.tsx`, `reports.$reportId.tsx`; `/` redirects to `/overview` or `/login`.
  - `src/features/auth/` — `AuthService` interface, `mockAuthService` (code → session token), `AuthProvider`/`useAuth`. UI never touches codes or storage directly.
  - `src/services/` — `HealthService`, `EnvironmentService`, `AlertsService`, `ReportsService`, `AssessmentService` interfaces with mock implementations. Every call takes the session token and resolves the astronaut from it (never an astronaut ID from the UI), mirroring future server-side access control. Simulated latency for real loading states.
  - `src/data/mock/` — per-astronaut seed data; `src/types/` — domain models.
  - `src/features/body3d/` — `BodyModel` interface + procedural region mesh model; swapping in a GLB later only replaces the model module.
  - `src/components/` — shared UI (SimulatedBadge, EmptyState, StatCard, TrendChart, etc.).
- Demo session kept in sessionStorage and clearly documented as non-production; services are the single swap point for a real backend (Lovable Cloud), real sensors, and the future AI model.
- Each page gets its own title/description metadata. Vitest tests for: valid/invalid codes, each code mapping to the right astronaut, and services refusing other astronauts' data.
