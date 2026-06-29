// ---------------------------------------------------------------------------
// In-browser "database" + simulated "backend" service layer.
//
// No server: a Zustand store persisted to localStorage is both the database
// (state) and the backend (the action methods hold all business logic). This
// keeps the app fully client-side and zero-install.
//
// Access model (v2): GROUP-based, not per-person. A dataset lists allowed
// departments and/or roles; Governance owns those lists plus a per-dataset
// governance checklist. Out-of-group users make a one-step request that
// Governance grants by adding their department.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AccessRequest,
  AuditEntry,
  Dataset,
  Department,
  ModelRequest,
  Role,
  Sensitivity,
  User,
} from '../types';
import {
  seedAudit,
  seedDatasets,
  seedModelRequests,
  seedRequests,
  seedUsers,
} from '../data/seed';
import { freshChecklist } from '../lib/access';
import {
  generateAnalytics,
  generateInlineModels,
  generateSampleRows,
} from '../services/mocks';

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, '0')}`.toUpperCase();
}

export interface PublishInput {
  name: string;
  description: string;
  department: Department;
  sensitivity: Sensitivity;
  stewardId: string;
  tags: string[];
  columns: string[];
}

/** Fields Governance may update on a dataset. */
export type GovernancePatch = Partial<
  Pick<Dataset, 'allowedDepartments' | 'allowedRoles' | 'governance' | 'status'>
>;

interface Session {
  userId: string | null;
  twoFactorPending: boolean;
  regionKey: string;
}

interface MarketState {
  users: User[];
  datasets: Dataset[];
  requests: AccessRequest[];
  modelRequests: ModelRequest[];
  audit: AuditEntry[];
  session: Session;

  // auth
  login: (workId: string, password: string) => { ok: boolean; error?: string };
  verifyTwoFactor: (code: string) => { ok: boolean; error?: string };
  logout: () => void;

  // demo/admin
  toggleOffNetwork: (userId: string) => void;
  setRegion: (regionKey: string) => void;
  resetDemo: () => void;

  // provider
  publishDataset: (ownerId: string, input: PublishInput) => string;

  // governance (group-based access + checklist)
  governanceUpdate: (datasetId: string, patch: GovernancePatch, byUserId: string) => void;

  // consumer one-step request
  requestAccess: (datasetId: string, requesterId: string, reason: string) => string;
  decideRequest: (
    requestId: string,
    approverId: string,
    decision: 'granted' | 'denied',
    note: string,
  ) => void;

  // heavy AI models (Data Department)
  requestModel: (datasetId: string, requesterId: string, modelName: string) => string;
  decideModelRequest: (
    requestId: string,
    approverId: string,
    decision: 'approved' | 'denied',
    note: string,
  ) => void;
}

function logAudit(state: MarketState, actorId: string, action: string, target: string): AuditEntry[] {
  return [
    { id: uid('AUD'), at: new Date().toISOString(), actorId, action, target },
    ...state.audit,
  ].slice(0, 200);
}

export const useStore = create<MarketState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      datasets: seedDatasets,
      requests: seedRequests,
      modelRequests: seedModelRequests,
      audit: seedAudit,
      session: { userId: null, twoFactorPending: false, regionKey: 'KSA' },

      // ----- auth --------------------------------------------------------
      login: (workId, password) => {
        const user = get().users.find((u) => u.id.toLowerCase() === workId.trim().toLowerCase());
        if (!user) return { ok: false, error: 'Unknown Work ID.' };
        if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
        set((s) => ({ session: { ...s.session, userId: user.id, twoFactorPending: true } }));
        return { ok: true };
      },
      verifyTwoFactor: (code) => {
        if (!code.trim()) return { ok: false, error: 'Enter any code or approve the push.' };
        const s = get();
        if (!s.session.userId) return { ok: false, error: 'Session expired, sign in again.' };
        set((st) => ({
          session: { ...st.session, twoFactorPending: false },
          audit: logAudit(st, st.session.userId!, 'Signed in (2FA confirmed)', st.session.userId!),
        }));
        return { ok: true };
      },
      logout: () =>
        set((s) => ({ session: { ...s.session, userId: null, twoFactorPending: false } })),

      // ----- demo/admin --------------------------------------------------
      toggleOffNetwork: (userId) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, offNetwork: !u.offNetwork } : u)),
        })),
      setRegion: (regionKey) => set((s) => ({ session: { ...s.session, regionKey } })),
      resetDemo: () =>
        set({
          users: seedUsers,
          datasets: seedDatasets,
          requests: seedRequests,
          modelRequests: seedModelRequests,
          audit: seedAudit,
          session: { userId: null, twoFactorPending: false, regionKey: 'KSA' },
        }),

      // ----- provider: publish ------------------------------------------
      publishDataset: (ownerId, input) => {
        const id = uid('DS');
        const sample = generateSampleRows(id, input.columns);
        const dataset: Dataset = {
          id,
          name: input.name,
          description: input.description,
          department: input.department,
          sensitivity: input.sensitivity,
          ownerId,
          stewardId: input.stewardId,
          createdAt: new Date().toISOString(),
          tags: input.tags,
          status: 'PendingGovernance', // Governance must define access first
          allowedDepartments: [], // owner still sees their own data (canView)
          allowedRoles: [],
          governance: freshChecklist(),
          analytics: generateAnalytics(id, input.columns),
          inlineModels: generateInlineModels(id),
          heavyModelsEnabled: [],
          sampleColumns: sample.columns,
          sampleRows: sample.rows,
        };
        set((s) => ({
          datasets: [dataset, ...s.datasets],
          audit: logAudit(s, ownerId, 'Published dataset (pending governance)', id),
        }));
        return id;
      },

      // ----- governance: access groups + checklist ----------------------
      governanceUpdate: (datasetId, patch, byUserId) =>
        set((s) => ({
          datasets: s.datasets.map((d) => (d.id === datasetId ? { ...d, ...patch } : d)),
          audit: logAudit(
            s,
            byUserId,
            patch.status === 'Published'
              ? 'Published dataset (governance)'
              : 'Updated governance / access groups',
            datasetId,
          ),
        })),

      // ----- consumer: one-step request ---------------------------------
      requestAccess: (datasetId, requesterId, reason) => {
        const id = uid('REQ');
        const requester = get().users.find((u) => u.id === requesterId)!;
        const req: AccessRequest = {
          id,
          datasetId,
          requesterId,
          requesterDepartment: requester.department,
          reason,
          status: 'pending',
          decidedBy: null,
          note: '',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          requests: [req, ...s.requests],
          audit: logAudit(s, requesterId, 'Requested access', datasetId),
        }));
        return id;
      },
      decideRequest: (requestId, approverId, decision, note) =>
        set((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          const requests = s.requests.map((r) =>
            r.id === requestId ? { ...r, status: decision, decidedBy: approverId, note } : r,
          );
          let datasets = s.datasets;
          if (req && decision === 'granted') {
            // Grant by adding the requester's DEPARTMENT to the allowed list.
            datasets = s.datasets.map((d) =>
              d.id === req.datasetId
                ? {
                    ...d,
                    allowedDepartments: Array.from(
                      new Set([...d.allowedDepartments, req.requesterDepartment]),
                    ),
                  }
                : d,
            );
          }
          return {
            requests,
            datasets,
            audit: logAudit(
              s,
              approverId,
              decision === 'granted'
                ? `Granted access to ${req?.requesterDepartment}`
                : 'Denied access request',
              requestId,
            ),
          };
        }),

      // ----- heavy AI models --------------------------------------------
      requestModel: (datasetId, requesterId, modelName) => {
        const id = uid('MRQ');
        const req: ModelRequest = {
          id,
          datasetId,
          requesterId,
          modelName,
          status: 'pending',
          decidedBy: null,
          note: '',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          modelRequests: [req, ...s.modelRequests],
          audit: logAudit(s, requesterId, `Requested heavy model "${modelName}"`, datasetId),
        }));
        return id;
      },
      decideModelRequest: (requestId, approverId, decision, note) =>
        set((s) => {
          const mr = s.modelRequests.find((r) => r.id === requestId);
          const modelRequests = s.modelRequests.map((r) =>
            r.id === requestId ? { ...r, status: decision, decidedBy: approverId, note } : r,
          );
          let datasets = s.datasets;
          if (mr && decision === 'approved') {
            datasets = s.datasets.map((d) =>
              d.id === mr.datasetId
                ? { ...d, heavyModelsEnabled: Array.from(new Set([...d.heavyModelsEnabled, mr.modelName])) }
                : d,
            );
          }
          return {
            modelRequests,
            datasets,
            audit: logAudit(s, approverId, `Model request ${decision}`, requestId),
          };
        }),
    }),
    { name: 'clr-data-marketplace', version: 2 },
  ),
);

// ---------------------------------------------------------------------------
// Selectors / pure helpers
// ---------------------------------------------------------------------------

export function currentUser(s: Pick<MarketState, 'users' | 'session'>): User | null {
  if (!s.session.userId || s.session.twoFactorPending) return null;
  return s.users.find((u) => u.id === s.session.userId) ?? null;
}

export function userById(users: User[], id: string | null): User | undefined {
  return users.find((u) => u.id === id);
}

export function hasRole(user: User | null | undefined, role: Role): boolean {
  return !!user?.roles.includes(role);
}

/** Pending request (if any) for a given user + dataset. */
export function openRequestFor(
  requests: AccessRequest[],
  datasetId: string,
  userId: string,
): AccessRequest | undefined {
  return requests.find(
    (r) => r.datasetId === datasetId && r.requesterId === userId && r.status === 'pending',
  );
}
