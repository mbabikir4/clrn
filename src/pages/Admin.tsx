// Admin console: directory of seeded users, network-flag toggles, the security
// audit log, and a reset-to-seed control for the demo.
import { currentUser, useStore, userById } from '../db/store';
import { ROLE_LABEL } from '../lib/labels';
import { ClearanceBadge, RoleBadge, SectionTitle } from '../components/ui';

export function Admin() {
  const store = useStore();
  currentUser(store);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="Administration" subtitle="Users, network flags and the security audit log." />
        <button
          className="btn-ghost"
          onClick={() => {
            if (confirm('Reset all demo data back to the seeded state?')) store.resetDemo();
          }}
        >
          Reset demo data
        </button>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-900">User directory ({store.users.length})</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Work ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2">Clearance</th>
                <th className="px-3 py-2">Network</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {store.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{u.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{u.name}</td>
                  <td className="px-3 py-2 text-slate-600">{u.department}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <RoleBadge key={r} role={r} />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <ClearanceBadge level={u.clearance} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className={`badge ${
                        u.offNetwork ? 'bg-slate-200 text-slate-600' : 'bg-brand-100 text-brand-700'
                      }`}
                      onClick={() => store.toggleOffNetwork(u.id)}
                      title="Toggle mocked network flag"
                    >
                      {u.offNetwork ? 'Off-network' : 'On-network'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Roles shown: {Array.from(new Set(store.users.flatMap((u) => u.roles))).map((r) => ROLE_LABEL[r]).join(', ')}.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Security audit log</h3>
        <div className="space-y-1 text-sm">
          {store.audit.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-1.5"
            >
              <span className="font-mono text-xs text-slate-400">
                {new Date(a.at).toLocaleString()}
              </span>
              <span className="font-medium text-slate-700">
                {userById(store.users, a.actorId)?.name ?? a.actorId}
              </span>
              <span className="text-slate-600">{a.action}</span>
              <span className="text-slate-400">→ {a.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
