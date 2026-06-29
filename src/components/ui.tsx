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
  // Blue = active/positive, neutral slate = pending/negative (blue+white theme).
  const map: Record<string, string> = {
    Published: 'bg-brand-100 text-brand-700',
    PendingGovernance: 'bg-slate-100 text-slate-600',
    Granted: 'bg-brand-100 text-brand-700',
    Denied: 'bg-slate-200 text-slate-600',
    Supervisor: 'bg-brand-100 text-brand-700',
    Risk: 'bg-slate-100 text-slate-600',
    Governance: 'bg-brand-100 text-brand-700',
    pending: 'bg-slate-100 text-slate-600',
    approved: 'bg-brand-100 text-brand-700',
    granted: 'bg-brand-100 text-brand-700',
    denied: 'bg-slate-200 text-slate-600',
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
    <span className="badge border border-brand-200 bg-brand-50 text-brand-700" title="Mocked for the proof-of-concept">
      {children}
    </span>
  );
}
