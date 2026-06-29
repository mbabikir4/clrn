// ---------------------------------------------------------------------------
// In-browser "database" + simulated "backend" service layer.
//
// For this PoC there is no server: a Zustand store persisted to localStorage
// plays the role of both the database (state) and the backend (the action
// methods below contain all business logic — auth, governance, the clearance
// workflow, etc.). This keeps the app fully client-side and zero-install while
// still cleanly separating "API calls" (store actions) from UI (components).
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AccessRequest,
  AuditEntry,
  ClearanceStep,
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
import {
  generateAnalytics,
  generateInlineModels,
  generateSampleRows,
} from '../services/mocks';

const STAGE_ORDER: ClearanceStep['stage'][] = ['Supervisor', 'Risk', 'Governance'];

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

interface Session {
  userId: string | null;
  twoFactorPending: boolean; // true between password check and 2FA confirmation
  regionKey: string; // active regulatory region (default "KSA")
}

interface MarketState {
  users: User[];
  datasets: Dataset[];
  requests: AccessRequest[];
  modelRequests: ModelRequest[];
  audit: AuditEntry[];
  session: Session;

  // --- auth ---
  login: (workId: string, password: string) => { ok: boolean; error?: string };
  verifyTwoFactor: (code: string) => { ok: boolean; error?: string };
  logout: () => void;

  // --- demo/admin toggles ---
  toggleOffNetwork: (userId: string) => void;
  setRegion: (regionKey: string) => void;
  resetDemo: () => void;

  // --- provider ---
  publishDataset: (ownerId: string, input: PublishInput) => string;

  // --- governance (ACL ownership) ---
  governanceSetAcl: (datasetId: string, acl: string[], byUserId: string) => void;
  governanceAddToAcl: (datasetId: string, userId: string, byUserId: string) => void;
  governanceRemoveFromAcl: (datasetId: string, userId: string, byUserId: string) => void;

  // --- consumer clearance workflow ---
  requestAccess: (datasetId: string, requesterId: string, reason: string) => string;
  decideClearanceStep: (
    requestId: string,
    approverId: string,
    decision: 'approved' | 'denied',
    note: string,
  ) => void;

  // --- heavy AI models (Data Department) ---
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
        // Password OK → move to the mocked 2-factor step.
        set((s) => ({ session: { ...s.session, userId: null, twoFactorPending: true } }));
        // Stash the candidate id on the session via a temp field encoded in userId.
        set((s) => ({ session: { ...s.session, userId: user.id, twoFactorPending: true } }));
        return { ok: true };
      },
      verifyTwoFactor: (code) => {
        // Any non-empty code (or the "approve" button passing "approve") works.
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
          status: 'PendingGovernance', // must go through Governance before broad access
          acl: [ownerId], // owner can always see their own data
          analytics: generateAnalytics(id, input.columns), // auto-generated on upload
          inlineModels: generateInlineModels(id), // inline models run automatically
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

      // ----- governance: ACL --------------------------------------------
      governanceSetAcl: (datasetId, acl, byUserId) =>
        set((s) => ({
          datasets: s.datasets.map((d) =>
            d.id === datasetId
              ? { ...d, acl: Array.from(new Set([d.ownerId, ...acl])), status: 'Published' }
              : d,
          ),
          audit: logAudit(s, byUserId, 'Set ACL & published dataset', datasetId),
        })),
      governanceAddToAcl: (datasetId, userId, byUserId) =>
        set((s) => ({
          datasets: s.datasets.map((d) =>
            d.id === datasetId ? { ...d, acl: Array.from(new Set([...d.acl, userId])) } : d,
          ),
          audit: logAudit(s, byUserId, `Granted ACL access to ${userId}`, datasetId),
        })),
      governanceRemoveFromAcl: (datasetId, userId, byUserId) =>
        set((s) => ({
          datasets: s.datasets.map((d) =>
            d.id === datasetId
              ? { ...d, acl: d.acl.filter((x) => x !== userId || x === d.ownerId) }
              : d,
          ),
          audit: logAudit(s, byUserId, `Revoked ACL access for ${userId}`, datasetId),
        })),

      // ----- consumer: clearance workflow -------------------------------
      requestAccess: (datasetId, requesterId, reason) => {
        const id = uid('REQ');
        const steps: ClearanceStep[] = STAGE_ORDER.map((stage) => ({
          stage,
          decidedBy: null,
          decision: 'pending',
          note: '',
          decidedAt: null,
        }));
        const req: AccessRequest = {
          id,
          datasetId,
          requesterId,
          reason,
          currentStage: 'Supervisor',
          steps,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          requests: [req, ...s.requests],
          audit: logAudit(s, requesterId, 'Requested clearance', datasetId),
        }));
        return id;
      },
      decideClearanceStep: (requestId, approverId, decision, note) =>
        set((s) => {
          const requests = s.requests.map((r) => {
            if (r.id !== requestId) return r;
            if (r.currentStage === 'Granted' || r.currentStage === 'Denied') return r;
            const steps = r.steps.map((st) =>
              st.stage === r.currentStage
                ? { ...st, decidedBy: approverId, decision, note, decidedAt: new Date().toISOString() }
                : st,
            );
            if (decision === 'denied') {
              return { ...r, steps, currentStage: 'Denied' as const };
            }
            // advance to the next stage, or grant if Governance just approved
            const idx = STAGE_ORDER.indexOf(r.currentStage as ClearanceStep['stage']);
            const next = STAGE_ORDER[idx + 1];
            return { ...r, steps, currentStage: (next ?? 'Granted') as AccessRequest['currentStage'] };
          });

          // If a request just became Granted, add the requester to the ACL.
          const justGranted = requests.find(
            (r) => r.id === requestId && r.currentStage === 'Granted',
          );
          let datasets = s.datasets;
          if (justGranted) {
            datasets = s.datasets.map((d) =>
              d.id === justGranted.datasetId
                ? { ...d, acl: Array.from(new Set([...d.acl, justGranted.requesterId])) }
                : d,
            );
          }

          const stageLabel = justGranted ? 'Granted access (added to ACL)' : `Decision: ${decision}`;
          return {
            requests,
            datasets,
            audit: logAudit(s, approverId, stageLabel, requestId),
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
    {
      name: 'clr-data-marketplace',
      version: 1,
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors / pure helpers (kept outside the store so components can reuse them)
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

export function hasAccess(dataset: Dataset, userId: string | null | undefined): boolean {
  if (!userId) return false;
  return dataset.acl.includes(userId);
}

/** Open access request (if any) for a given user + dataset. */
export function openRequestFor(
  requests: AccessRequest[],
  datasetId: string,
  userId: string,
): AccessRequest | undefined {
  return requests.find(
    (r) =>
      r.datasetId === datasetId &&
      r.requesterId === userId &&
      r.currentStage !== 'Denied',
  );
}
