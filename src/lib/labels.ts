// Human-readable labels and color tokens for enums. Pure data, no JSX.
import type { ClearanceLevel, Role } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  Provider: 'Data Provider',
  Consumer: 'Data Consumer',
  Risk: 'Risk Management',
  Governance: 'Governance',
  DataDept: 'Data Department',
  Supervisor: 'Supervisor / Manager',
  Admin: 'Administrator',
};

export const ROLE_COLOR: Record<Role, string> = {
  Provider: 'bg-sky-100 text-sky-700',
  Consumer: 'bg-slate-100 text-slate-700',
  Risk: 'bg-amber-100 text-amber-800',
  Governance: 'bg-violet-100 text-violet-700',
  DataDept: 'bg-emerald-100 text-emerald-700',
  Supervisor: 'bg-blue-100 text-blue-700',
  Admin: 'bg-rose-100 text-rose-700',
};

export const CLEARANCE_COLOR: Record<ClearanceLevel, string> = {
  Public: 'bg-slate-100 text-slate-600',
  Internal: 'bg-sky-100 text-sky-700',
  Confidential: 'bg-amber-100 text-amber-800',
  Restricted: 'bg-rose-100 text-rose-700',
};

export const CLEARANCE_RANK: Record<ClearanceLevel, number> = {
  Public: 0,
  Internal: 1,
  Confidential: 2,
  Restricted: 3,
};

export const DEPARTMENTS = [
  'Retail Banking',
  'Commercial Banking',
  'Investment Banking',
  'Wealth Management',
  'Risk Management',
] as const;

export const SENSITIVITIES = ['Public', 'Internal', 'Confidential', 'Restricted'] as const;
