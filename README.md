# CLR Data Marketplace — Proof of Concept

An internal **data marketplace** web app with **governed, group-based access**. Every
employee can publish data (provider) and consume data (consumer). **Governance** owns
access: for each dataset it completes a checklist and chooses which **departments / roles**
may view it. The marketplace is **free of charge but never open** — every dataset is
governed, and data is **view-only**.

> **Access model (v2):** access is granted by **group** (department or functional role),
> **not per person**. If your department/role is on a dataset's allow-list you can view it;
> if not, you make a **one-step request** that Governance approves (which grants your whole
> department). This replaced the earlier per-person ACL + Supervisor→Risk→Governance chain
> to keep the prototype simple.

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

This is the end-to-end path the PoC demonstrates: **publish → governance checklist + access
groups → request → governance approval (grants department) → access → automatic analytics → AI model.**

1. **Login + 2FA** — Sign in with a Work ID + `demo`, then complete the **mocked 2-factor
   step** (type any code or click **Approve push**). Your **role(s)** and **department** are
   resolved from the Work ID. Your **Profile** shows identity, roles, clearance and the
   datasets your group can access.

2. **Publish (provider)** — As any provider (e.g. `WID-1001`), go to **Publish**. Add
   metadata: name, description, owning department, **nature/sensitivity**, the **named person
   responsible for clearing it (steward)**, tags, and columns. On submit the dataset is
   **routed to Governance** (status *Pending Governance*) and isn't in the catalog yet.

3. **Governance: checklist + access groups** — Log in as **Governance `WID-3001`** →
   **Governance console**. For the new dataset, tick the **governance checklist**
   (classification, regulatory reviewed, groups defined, approved-for-view), choose which
   **departments and/or roles** may view it, then **Publish to marketplace**.

4. **Automatic access by group** — Anyone whose **department or role** is on the allow-list
   now sees the data immediately (e.g. `WID-1001`, Retail Banking, opens **Retail Customer
   360** — instant access, no request).

5. **Request (out-of-group consumer)** — Log in as someone whose group **isn't** allowed
   (e.g. `WID-1002`, Commercial Banking, opening the Investment-only **M&A Deal Pipeline**).
   Click **Request access** with a justification. Track it under **My Requests**.

6. **Governance approval (one step)** — Log in as **Governance `WID-3001`** → **Governance
   console** → *Access requests* → **Grant to {department}**. This adds the requester's whole
   **department** to the dataset's allow-list.

7. **Access granted** — Back as the consumer (`WID-1002`), the dataset now shows **"Your group
   has access"** and the **view-only data preview** unlocks.

8. **Automatic analytics** — Every dataset shows **auto-generated** (mocked) analytics:
   row/column counts, completeness, a column profile, and **charts**. No manual pipeline.

9. **Inline AI models** — On a dataset you can view, **clustering, regression and anomaly
   detection** run **inline and automatically** (mocked results + charts).

10. **Heavy AI model** — For a larger model, request it from the **Data Department**. Log in as
    **Data Dept `WID-4001`** → **Data Dept** queue → **Approve & enable**.

### Pre-seeded shortcuts to see mid-flow states
- `DS-006 "Mortgage Default Signals"` is **Pending Governance** (step 3 ready to try).
- `REQ-001` is a pending **access request** (Commercial Banking → M&A Deal Pipeline) — log in
  as **Governance `WID-3001`** to grant it (steps 6–7).
- `MRQ-001` is a pending **heavy-model** request — log in as `WID-4001` to action it (step 10).

---

## Roles & responsibilities

- **Provider / Consumer** — every employee. Publish datasets; browse and request data.
- **Governance** — the heart of access control. Per dataset: completes the **checklist**,
  chooses the **allowed departments/roles**, publishes, and approves one-step access requests
  (granting the requester's department). Dedicated **Governance console**, Governance-only.
- **Risk Management** — a department/role that data can be shared with (no longer an approval
  gate in v2).
- **Supervisor / Manager** — org-structure role (no longer an approval gate in v2).
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
- **Group checks before any row-level data access** — aggregate analytics are visible in the
  catalog, but view-only raw data + inline models require your department/role to be allowed.
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
  lib/access.ts            # Group-based access rules + governance checklist definition
  lib/labels.ts            # Enum → label/color maps
  components/              # Layout, SecurityBanner, charts, UI atoms
  pages/                   # Login, Marketplace, DatasetDetail, Publish, Governance,
                           # DataDepartment, Regulatory, Admin, Profile, MyRequests
  App.tsx                  # Role-gated routing
```

The single source of business logic is `src/db/store.ts` — auth, group-based access,
the governance checklist + access-group updates, one-step request approval, publish, and
the heavy-model approval flow all live there, cleanly separated from the React UI.
Access rules live in `src/lib/access.ts` (`canView`).
