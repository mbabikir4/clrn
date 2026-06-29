// Catalog of datasets with search + department/sensitivity filters.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { currentUser, useStore } from '../db/store';
import { canView } from '../lib/access';
import { DEPARTMENTS } from '../lib/labels';
import { ClearanceBadge, SectionTitle, StatusBadge } from '../components/ui';

export function Marketplace() {
  const store = useStore();
  const user = currentUser(store)!;
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('All');

  const visible = useMemo(() => {
    return store.datasets
      .filter((d) => {
        // Pending-governance datasets are only visible to their owner + governance.
        if (d.status === 'PendingGovernance') {
          return d.ownerId === user.id || user.roles.includes('Governance');
        }
        return true;
      })
      .filter((d) => (dept === 'All' ? true : d.department === dept))
      .filter((d) => {
        if (!q.trim()) return true;
        const hay = `${d.name} ${d.description} ${d.tags.join(' ')} ${d.department}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });
  }, [store.datasets, q, dept, user]);

  return (
    <div>
      <SectionTitle
        title="Data Marketplace"
        subtitle="Free of charge, but never open: every dataset is governed and access is by department / role."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search datasets, tags…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input max-w-xs" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="All">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{visible.length} datasets</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((d) => {
          const allowed = canView(d, user);
          return (
            <Link
              key={d.id}
              to={`/dataset/${d.id}`}
              className="card flex flex-col p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{d.name}</h3>
                <ClearanceBadge level={d.sensitivity} />
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">{d.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.tags.slice(0, 4).map((t) => (
                  <span key={t} className="badge bg-slate-100 text-slate-500">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">{d.department}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} />
                  {allowed ? (
                    <span className="badge bg-brand-100 text-brand-700">Access granted</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500">Access required</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {visible.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No datasets match your filters.</p>
      )}
    </div>
  );
}
