// Central access rules + governance checklist definition.
// Access is GROUP-based (department or functional role), never per-person.
import type { ChecklistItem, Dataset, User } from '../types';

/** The fixed governance checklist every dataset carries (Governance ticks these). */
export const GOVERNANCE_CHECKLIST: { key: string; label: string }[] = [
  { key: 'classification', label: 'Sensitivity / classification confirmed' },
  { key: 'regulatory', label: 'Regulatory checks reviewed (SAMA / PDPL)' },
  { key: 'groups', label: 'Allowed groups (departments / roles) defined' },
  { key: 'approved', label: 'Approved for marketplace — view only' },
];

/** Build a fresh, all-unchecked governance checklist for a new dataset. */
export function freshChecklist(): ChecklistItem[] {
  return GOVERNANCE_CHECKLIST.map((c) => ({ ...c, done: false }));
}

/**
 * Can this user VIEW the dataset?
 *  - the owner always can;
 *  - Governance and Admin always can (they administer the catalog);
 *  - otherwise the user's department or one of their roles must be allowed.
 */
export function canView(dataset: Dataset, user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.id === dataset.ownerId) return true;
  if (user.roles.includes('Governance') || user.roles.includes('Admin')) return true;
  if (dataset.allowedDepartments.includes(user.department)) return true;
  return user.roles.some((r) => dataset.allowedRoles.includes(r));
}

/** True once Governance has ticked every checklist item. */
export function governanceComplete(dataset: Dataset): boolean {
  return dataset.governance.every((c) => c.done);
}
