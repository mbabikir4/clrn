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

// Theme is light blue + white only: badges use blue tints + neutral slate.
export const ROLE_COLOR: Record<Role, string> = {
  Provider: 'bg-brand-100 text-brand-700',
  Consumer: 'bg-slate-100 text-slate-600',
  Risk: 'bg-brand-100 text-brand-700',
  Governance: 'bg-brand-100 text-brand-700',
  DataDept: 'bg-brand-100 text-brand-700',
  Supervisor: 'bg-slate-100 text-slate-600',
  Admin: 'bg-brand-100 text-brand-700',
};

// Single classification level — all data is Internal.
export const CLEARANCE_COLOR: Record<ClearanceLevel, string> = {
  Internal: 'bg-brand-100 text-brand-700',
};

export const CLEARANCE_RANK: Record<ClearanceLevel, number> = {
  Internal: 0,
};

export const DEPARTMENTS = [
  'Retail Banking',
  'Commercial Banking',
  'Investment Banking',
  'Wealth Management',
  'Risk Management',
] as const;

export const SENSITIVITIES = ['Internal'] as const;

// Roles that Governance can grant view access to. "Consumer" effectively means
// "all employees" (everyone holds it); the rest scope access to a function.
export const ACCESS_ROLES: Role[] = ['Consumer', 'Risk', 'DataDept', 'Supervisor', 'Admin'];
