// User profile: identity, roles, department, supervisor, clearance, and the
// datasets the user currently has access to (per the ACLs).
import { Link } from 'react-router-dom';
import { currentUser, useStore, userById } from '../db/store';
import { canView } from '../lib/access';
import { ClearanceBadge, RoleBadge, SectionTitle, StatusBadge, UserName } from '../components/ui';

export function Profile() {
  const store = useStore();
  const user = currentUser(store)!;
  const supervisor = userById(store.users, user.supervisorId);
  const accessible = store.datasets.filter((d) => canView(d, user));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-6 lg:col-span-1">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {user.name
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.id}</div>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Email">{user.email}</Row>
          <Row label="Department">{user.department}</Row>
          <Row label="Supervisor / Manager">
            <UserName user={supervisor} id={user.supervisorId ?? '—'} />
          </Row>
          <Row label="Clearance level">
            <ClearanceBadge level={user.clearance} />
          </Row>
          <Row label="Network status">
            {user.offNetwork ? (
              <span className="badge bg-slate-200 text-slate-600">Off corporate network</span>
            ) : (
              <span className="badge bg-brand-100 text-brand-700">On corporate network</span>
            )}
          </Row>
        </dl>

        <div className="mt-5">
          <div className="label">Roles</div>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>

        <button
          className="btn-ghost mt-6 w-full"
          onClick={() => store.toggleOffNetwork(user.id)}
          title="Demo toggle to simulate leaving the corporate network"
        >
          {user.offNetwork ? 'Simulate reconnecting to network' : 'Simulate leaving the network'}
        </button>
      </div>

      <div className="card p-6 lg:col-span-2">
        <SectionTitle
          title="My data access"
          subtitle="Datasets your department or role is allowed to view."
        />
        {accessible.length === 0 ? (
          <p className="text-sm text-slate-500">
            You currently have access to no datasets. Browse the{' '}
            <Link to="/marketplace" className="text-brand-600 underline">
              marketplace
            </Link>{' '}
            and request clearance.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Dataset</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Sensitivity</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accessible.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 font-medium text-slate-800">{d.name}</td>
                    <td className="px-4 py-2 text-slate-600">{d.department}</td>
                    <td className="px-4 py-2">
                      <ClearanceBadge level={d.sensitivity} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/dataset/${d.id}`} className="text-brand-600 hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
