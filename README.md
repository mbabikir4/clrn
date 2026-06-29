# CLR Data Marketplace — Proof of Concept

An internal **data marketplace** web app with **governed, role-based access**. Every
employee can publish data (provider) and consume data (consumer); dedicated roles —
**Governance, Risk Management, Supervisor/Manager, Data Department, Admin** — gate and
approve access. The marketplace is **free of charge but never open**: every dataset is
governed and access is granted **per person**.

> ⚠️ This is a **demo / proof of concept**. All users, datasets, approvals,
> analytics, AI results, 2FA, network detection, and compliance checks are **mocked**.
> Nothing here is production-grade. Do not put real data in it.

---

## Chosen stack & why

| Layer | Choice | Why |
|------|--------|-----|
| **Frontend** | **React 18 + TypeScript + Vite** | Fast, modern, batteries-included SPA tooling. Vite gives instant builds and a single static bundle. |
| **Styling** | **Tailwind CSS** | Build a clean, consistent UI quickly without hand-writing CSS. |
| **"Backend"** | **In-app service layer** (`src/db/store.ts`) | For a fully-mocked PoC, a real server adds friction without value. All business logic — auth, the governance/clearance workflow, ACL management — lives in one clearly-separated service module that the UI calls like an API. |
| **"Database"** | **Zustand + `localStorage` persistence** | A lightweight, reactive store **persisted to the browser** acts as the database. State survives refreshes; "Reset demo data" restores the seed. No DB server to install. |
| **Charting** | **Recharts** | Simple, declarative React charts for the auto-generated analytics and inline AI-model visualizations. |
| **Routing** | **React Router** | Role-gated client-side routing. |

### Why this satisfies "runs fully in the browser / cloud, zero local install on your machine"

The app compiles to **static HTML/CSS/JS** — there is no server process and no database to
run. That means you can **build and host it entirely in the cloud** and just open a URL:

- **GitHub Pages (included, fully automated):** a GitHub Actions workflow
  (`.github/workflows/deploy.yml`) builds and publishes the app on every push. Enable it
  once (**Settings → Pages → Source: "GitHub Actions"**) and every push to the branch
  deploys a live preview URL — **nothing installed locally**.
- **Vercel / Netlify:** "Import Git repository" → framework auto-detected as Vite → Deploy.
  `vercel.json` and `public/_redirects` are included for SPA routing.
- **StackBlitz / CodeSandbox:** open the repo in the browser-based IDE; it installs and
  runs in the cloud.

There is a **trade-off** worth stating plainly: because the "backend" and "database" are
simulated in the browser, state is **per-browser** (great for a single-user demo, not a
shared multi-user system). That is the right call for a mocked PoC and keeps the
zero-install promise. The code is structured (`src/db/store.ts` is the only place with
business logic) so it could later be swapped for a real API + database with minimal UI
changes.

---

## Run it

### Cloud / no local install (recommended)
Use any of the deploy paths above (GitHub Pages is wired up and automatic).

### Locally (optional, if you ever want to)
```bash
npm install
npm run dev      # http://localhost:5173
# or a production preview:
npm run build && npm run preview
```

The demo password for **every** account is `demo`.

---

## Demo Work IDs (one per role)

| Work ID | Name | Roles | Department |
|--------|------|-------|-----------|
| `WID-1001` | Sarah Al-Otaibi | Provider, Consumer | Retail Banking |
| `WID-1002` | Khalid Al-Harbi | Provider, Consumer | Commercial Banking |
| `WID-1003` | Maha Al-Qahtani | Provider, Consumer *(flagged off-network)* | Investment Banking |
| `WID-1004` | Noura Al-Dossari | Provider, Consumer | Wealth Management |
| `WID-1010` | Faisal Al-Mutairi | **Supervisor**, Provider, Consumer | Retail Banking |
| `WID-1011` | Layla Al-Ghamdi | **Supervisor**, Provider, Consumer | Investment Banking |
| `WID-1099` | Abdullah Al-Faisal | **Supervisor** (of supervisors) | Risk Management |
| `WID-2001` | Omar Al-Zahrani | **Risk Management**, Consumer | Risk Management |
| `WID-3001` | Reem Al-Shehri | **Governance**, Consumer | Investment Banking |
| `WID-4001` | Yousef Al-Anazi | **Data Department**, Consumer | Wealth Management |
| `WID-9001` | Huda Al-Rashid | **Admin**, Consumer | Retail Banking |

Password for all: `demo`. The login screen also has quick-login chips.

---

## Full flow walkthrough

This is the end-to-end path the PoC demonstrates: **publish → governance sets access →
request → supervisor → risk → governance approval → access → automatic analytics → AI model.**

1. **Login + 2FA** — Sign in with a Work ID + `demo`, then complete the **mocked 2-factor
   step** (type any code or click **Approve push**). Your **role(s)** are resolved from the
   Work ID. Your **profile** (name, ID, roles, department, supervisor, clearance, and the
   datasets you can access) is on the **Profile** page.

2. **Publish (provider)** — As any provider (e.g. `WID-1001`), go to **Publish**. Add
   metadata: name, description, owning department, **nature/sensitivity**, the **named person
   responsible for clearing it (steward)**, tags, and columns. On submit the dataset is
   **routed to Governance** and is **not broadly accessible yet** (status *Pending Governance*).

3. **Governance sets access** — Log in as **Governance `WID-3001`** → **Governance console**.
   Under *Awaiting access definition*, pick the **initial ACL** for the new dataset and
   **Set ACL & publish**. A dataset isn't broadly visible until Governance has defined who can
   see it.

4. **Request (consumer)** — Log in as someone **not on the ACL** (e.g. `WID-4001`). Open a
   dataset in the **Marketplace**. Because you're not on the ACL, you **Request access** with a
   business justification. Track it under **My Requests**.

5. **Supervisor sign-off (gate 1)** — Log in as the requester's **Supervisor**
   (`WID-4001`'s manager is `WID-1099`) → **Approvals** → approve.

6. **Risk Management review (gate 2)** — Log in as **Risk `WID-2001`** → **Approvals** → approve.

7. **Governance approval (gate 3, sets ACL)** — Log in as **Governance `WID-3001`** →
   **Governance console** → *Clearance requests for approval* → **Approve & add to ACL**.
   This adds the person to the dataset's ACL.

8. **Access granted** — Back as the consumer (`WID-4001`), the dataset now shows
   **"You are on the ACL"** and the **row-level data preview** unlocks.

9. **Automatic analytics** — Every dataset shows **auto-generated** (mocked) analytics:
   row/column counts, completeness, a column profile, and **charts** (distribution, trend,
   segments). No manual pipeline.

10. **Inline AI models** — On a dataset you can access, **clustering, regression and anomaly
    detection** run **inline and automatically** (mocked results + charts).

11. **Heavy AI model** — For a larger model, request it from the **Data Department**. Log in as
    **Data Dept `WID-4001`** → **Data Dept** queue → **Approve & enable**; the heavy model then
    appears as enabled on that dataset.

### Pre-seeded shortcuts to see mid-flow states
- `DS-006 "Mortgage Default Signals"` is **Pending Governance** (step 3 ready to try).
- `REQ-001` is an in-flight request already **past Supervisor, awaiting Risk** — log in as
  `WID-2001` to action it (steps 6–8).
- `MRQ-001` is a pending **heavy-model** request — log in as `WID-4001` to action it (step 11).

---

## Roles & responsibilities

- **Provider / Consumer** — every employee. Publish datasets; browse and request data.
- **Governance** — the heart of access control. Defines each dataset's ACL, gives final
  approval on clearance requests (which adds the person to the ACL), and manages all ACLs.
  Dedicated **Governance console**, visible only to Governance users.
- **Supervisor / Manager** — gate 1 of clearance (business-need sign-off).
- **Risk Management** — gate 2 of clearance (credit/operational risk review).
- **Data Department** — approves heavy/large AI models per dataset.
- **Admin** — user directory, network-flag toggles, security audit log, demo reset.

## Departments
Retail Banking · Commercial Banking · Investment Banking · Wealth Management · Risk Management.
Both users and datasets are tagged with these.

## Regulatory & Compliance (mocked)
A **Regulatory** module runs mocked **pass/flag** controls per dataset. The **region is
configurable** and defaults to a **Saudi Arabia (SAMA / PDPL)** profile; EU (GDPR) and US
(GLBA/CCPA) profiles are included. Clearly labelled as a **PoC stub**.

## Security awareness (all mocked, but visibly present)
- **Role-based access** enforced on every nav item, route, and action.
- **ACL checks before any row-level data access** — aggregate analytics are visible in the
  catalog, but raw data + inline models require being on the ACL.
- **Mocked 2FA** step on login.
- **Mocked network alert** — a prominent banner when a user is flagged off the corporate
  network; row-level data access is blocked while off-network. Toggle it on **Profile** or in
  **Admin** (`WID-1003` starts off-network).
- **Audit log** of key actions (sign-in, approvals, ACL changes) in **Admin**.

---

## Project structure

```
src/
  types.ts                 # Domain model (users, datasets, requests, ACLs, …)
  data/seed.ts             # Seeded demo users, datasets, requests (every role/dept)
  db/store.ts              # The "backend + database": all business logic + persistence
  services/mocks.ts        # Mocked generators: analytics, AI models, compliance, regions
  lib/labels.ts            # Enum → label/color maps
  components/              # Layout, SecurityBanner, charts, clearance timeline, UI atoms
  pages/                   # Login, Marketplace, DatasetDetail, Publish, Governance,
                           # Approvals, DataDepartment, Regulatory, Admin, Profile, MyRequests
  App.tsx                  # Role-gated routing
```

The single source of business logic is `src/db/store.ts` — auth, the
Supervisor → Risk → Governance clearance state machine, ACL mutations, publish, and the
heavy-model approval flow all live there, cleanly separated from the React UI.
