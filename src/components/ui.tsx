// Small presentational helpers shared across pages.
import type { ClearanceLevel, Role, User } from '../types';
import { CLEARANCE_COLOR, ROLE_COLOR, ROLE_LABEL } from '../lib/labels';

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`badge ${ROLE_COLOR[role]}`}>{ROLE_LABEL[role]}</span>;
}

export function ClearanceBadge({ level }: { level: ClearanceLevel }) {
  return <span className={`badge ${CLEARANCE_COLOR[level]}`}>{level}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Published: 'bg-emerald-100 text-emerald-700',
    PendingGovernance: 'bg-amber-100 text-amber-800',
    Granted: 'bg-emerald-100 text-emerald-700',
    Denied: 'bg-rose-100 text-rose-700',
    Supervisor: 'bg-blue-100 text-blue-700',
    Risk: 'bg-amber-100 text-amber-800',
    Governance: 'bg-violet-100 text-violet-700',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-700',
    denied: 'bg-rose-100 text-rose-700',
  };
  const label = status === 'PendingGovernance' ? 'Pending Governance' : status;
  return <span className={`badge ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{label}</span>;
}

/** Render a user as "Name (WID)" with graceful fallback to the raw id. */
export function UserName({ user, id }: { user?: User; id?: string }) {
  if (user) return <span>{user.name} <span className="text-slate-400">({user.id})</span></span>;
  return <span className="text-slate-500">{id ?? 'Unknown'}</span>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function PocStub({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge bg-yellow-100 text-yellow-800" title="Mocked for the proof-of-concept">
      {children}
    </span>
  );
}
