// Governance console (simplified). Per dataset, Governance:
//   1) ticks a governance/regulatory checklist,
//   2) selects which departments / roles may VIEW the data (group-based access),
//   3) publishes it.
// It also handles one-step access requests (approve = add requester's dept).
import { Link } from 'react-router-dom';
import { currentUser, useStore, userById } from '../db/store';
import type { ChecklistItem, Dataset, Department, Role } from '../types';
import { governanceComplete } from '../lib/access';
import { ACCESS_ROLES, DEPARTMENTS, ROLE_LABEL } from '../lib/labels';
import { ClearanceBadge, Empty, RoleBadge, SectionTitle, StatusBadge, UserName } from '../components/ui';

export function Governance() {
  const store = useStore();
  const me = currentUser(store)!;

  const pending = store.datasets.filter((d) => d.status === 'PendingGovernance');
  const published = store.datasets.filter((d) => d.status === 'Published');
  const requests = store.requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Governance console"
        subtitle="Checklist + who can view each dataset."
      />

      {/* 1. Awaiting governance */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Awaiting governance</h3>
        <p className="mb-4 text-sm text-slate-500">
          Complete the checklist, set access, publish.
        </p>
        {pending.length === 0 ? (
          <Empty>Nothing waiting for Governance.</Empty>
        ) : (
          <div className="space-y-4">
            {pending.map((d) => (
              <GovDatasetCard key={d.id} dataset={d} byUserId={me.id} />
            ))}
          </div>
        )}
      </div>

      {/* 2. One-step access requests */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Access requests</h3>
        <p className="mb-4 text-sm text-slate-500">
          Approving grants the requester's department.
        </p>
        {requests.length === 0 ? (
          <Empty>No pending access requests.</Empty>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const ds = store.datasets.find((d) => d.id === r.datasetId);
              const requester = userById(store.users, r.requesterId);
              return (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800">{ds?.name}</div>
                      <div className="text-sm text-slate-500">
                        <UserName user={requester} id={r.requesterId} /> •{' '}
                        <strong>{r.requesterDepartment}</strong>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">“{r.reason}”</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-danger"
                        onClick={() => store.decideRequest(r.id, me.id, 'denied', 'Denied by Governance.')}
                      >
                        Deny
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          store.decideRequest(r.id, me.id, 'granted', 'Department granted access.')
                        }
                      >
                        Grant to {r.requesterDepartment}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Published datasets — manage groups + checklist */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Published datasets</h3>
        <p className="mb-4 text-sm text-slate-500">Adjust access or checklist anytime.</p>
        <div className="space-y-4">
          {published.map((d) => (
            <GovDatasetCard key={d.id} dataset={d} byUserId={me.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Editable governance card: checklist + allowed departments/roles + publish. */
function GovDatasetCard({ dataset, byUserId }: { dataset: Dataset; byUserId: string }) {
  const store = useStore();

  function toggleChecklist(key: string) {
    const governance: ChecklistItem[] = dataset.governance.map((c) =>
      c.key === key ? { ...c, done: !c.done } : c,
    );
    store.governanceUpdate(dataset.id, { governance }, byUserId);
  }
  function toggleDept(dep: Department) {
    const allowedDepartments = dataset.allowedDepartments.includes(dep)
      ? dataset.allowedDepartments.filter((x) => x !== dep)
      : [...dataset.allowedDepartments, dep];
    store.governanceUpdate(dataset.id, { allowedDepartments }, byUserId);
  }
  function toggleRole(role: Role) {
    const allowedRoles = dataset.allowedRoles.includes(role)
      ? dataset.allowedRoles.filter((x) => x !== role)
      : [...dataset.allowedRoles, role];
    store.governanceUpdate(dataset.id, { allowedRoles }, byUserId);
  }

  const isPending = dataset.status === 'PendingGovernance';
  const complete = governanceComplete(dataset);

  return (
    <div
      className={`rounded-lg border p-4 ${
        isPending ? 'border-brand-200 bg-brand-50/60' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to={`/dataset/${dataset.id}`} className="font-medium text-slate-800 hover:underline">
            {dataset.name}
          </Link>{' '}
          <ClearanceBadge level={dataset.sensitivity} /> <StatusBadge status={dataset.status} />
          <div className="text-sm text-slate-500">
            {dataset.department} • steward{' '}
            <UserName user={userById(store.users, dataset.stewardId)} id={dataset.stewardId} />
          </div>
        </div>
        {isPending && (
          <button
            className="btn-primary"
            disabled={!complete}
            title={complete ? '' : 'Complete the checklist first'}
            onClick={() => store.governanceUpdate(dataset.id, { status: 'Published' }, byUserId)}
          >
            Publish to marketplace
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Checklist */}
        <div>
          <div className="label">Governance checklist</div>
          <ul className="space-y-1">
            {dataset.governance.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={c.done}
                    onChange={() => toggleChecklist(c.key)}
                  />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Allowed departments */}
        <div>
          <div className="label">Allowed departments</div>
          <div className="flex flex-wrap gap-1.5">
            {DEPARTMENTS.map((dep) => {
              const on = dataset.allowedDepartments.includes(dep);
              return (
                <button
                  key={dep}
                  onClick={() => toggleDept(dep)}
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    on
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {on ? '✓ ' : '+ '}
                  {dep}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allowed roles */}
        <div>
          <div className="label">Allowed roles</div>
          <div className="flex flex-wrap gap-1.5">
            {ACCESS_ROLES.map((role) => {
              const on = dataset.allowedRoles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`rounded-lg border px-2 py-1 text-xs ${
                    on
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                  title={role === 'Consumer' ? 'All employees' : ROLE_LABEL[role]}
                >
                  {on ? '✓ ' : '+ '}
                  {role === 'Consumer' ? 'All employees' : ROLE_LABEL[role]}
                </button>
              );
            })}
          </div>
          {dataset.allowedDepartments.length === 0 && dataset.allowedRoles.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              No groups selected — only the owner and Governance can view.
            </p>
          )}
        </div>
      </div>

      {/* Current grant summary */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Can view:</span>
        {dataset.allowedDepartments.map((dep) => (
          <span key={dep} className="badge bg-slate-100 text-slate-600">
            {dep}
          </span>
        ))}
        {dataset.allowedRoles.map((r) => (
          <RoleBadge key={r} role={r} />
        ))}
        {dataset.allowedDepartments.length === 0 && dataset.allowedRoles.length === 0 && (
          <span className="text-slate-400">owner + Governance only</span>
        )}
      </div>
    </div>
  );
}
