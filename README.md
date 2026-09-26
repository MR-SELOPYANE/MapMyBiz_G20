# MAP_MY_BIZZ_PROJECTG20
--Sho Kabza use the Table_schema.sql to cerate tables and 
the CRUDE.sql is for queries i'll be manupulating as time goes --

## Dashboards (user + admin)

### 1. Run the database schema first
`sql/dashboards.sql` adds the four tables the dashboards need
(`subscriptions`, `business_metrics`, `certificates`, `promotions`) plus
row-level security. Paste it into the Supabase SQL editor and run it.
Re-running it is safe.

### 2. Environment
Copy `.env.example` to `.env` and set:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Data storage |
| `VITE_ADMIN_EMAILS` | Comma-separated emails allowed to open `#/admin` |
| `VITE_AI_ANALYSIS_URL` | Optional AI endpoint. Leave empty and the app runs its own on-device analysis engine (works with no backend and no data) |

Without the schema the dashboards still render — every service falls back
to `localStorage` — but data will not sync between devices.

### 3. Routes
- `#/dashboard` — user dashboard
- `#/my-business` — the user's listings
- `#/subscriptions` — plans, upgrade, downgrade, cancel
- `#/admin` — admin dashboard (overview by default)
- `#/admin/subscriptions`, `#/admin/promotions`, `#/admin/analytics`, `#/admin/approvals`

### User dashboard
Dynamic: the cards re-render from the user's plan, so a plan change on
`#/subscriptions` immediately opens or closes the paid features.
- **Business growth** — record revenue / costs / customers per month, see
  month-on-month change, profit, margin and (Pro+) a 3-month forecast.
- **AI assistance** — health score, insights and next actions. Pro (10 a
  month) and Premium (unlimited); free users see the locked card.
- **Progress check** — module completion, the next module to do, and
  per-track certificate progress.
- **Certificates** — earned automatically when a track is finished
  (`src/data/tracks.js`). Pro+ can print/save a PDF and share the
  verification reference.
- **My businesses** — listing status at a glance.

### Plans (`src/data/plans.js` — single source of truth)
| Plan | Price | Adds |
| --- | --- | --- |
| Free Explorer | R0 | 15 modules, progress, map listing, 3 months of numbers |
| Pro Growth | R149/mo | AI analysis (10/mo), 12 months + forecast, shareable certificates |
| Premium Partner | R399/mo | Unlimited AI, reports, mentor sessions, advisor, promotion priority |

### Admin dashboard
- **Business analytics** — MRR, conversion, churn, renewals due, plan mix,
  listing counts, top categories.
- **Subscriptions** — search/filter every subscriber, change plan, grant
  Pro, pause (mark overdue), resume, cancel, export CSV.
- **Promotions** — create campaigns (channel, code, discount, dates,
  audience), activate/pause, delete.
- **Listing approvals** — approve, feature or reject pending listings.

### Tests
`npm run test:run` covers the dashboard logic (growth maths, forecast,
certificate tracks, plan gating, the AI engine and the admin role check).
