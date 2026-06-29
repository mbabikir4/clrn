// Consumer view of their own access + model requests and their status.
import { Link } from 'react-router-dom';
import { currentUser, useStore } from '../db/store';
import { Empty, SectionTitle, StatusBadge } from '../components/ui';

export function MyRequests() {
  const store = useStore();
  const me = currentUser(store)!;
  const myRequests = store.requests.filter((r) => r.requesterId === me.id);
  const myModelRequests = store.modelRequests.filter((m) => m.requesterId === me.id);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="My requests"
        subtitle="Reviewed by Governance."
      />

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Access requests</h3>
        {myRequests.length === 0 ? (
          <Empty>
            You have no access requests. Find data in the{' '}
            <Link to="/marketplace" className="text-brand-600 underline">
              marketplace
            </Link>
            .
          </Empty>
        ) : (
          <div className="space-y-2 text-sm">
            {myRequests.map((r) => {
              const ds = store.datasets.find((d) => d.id === r.datasetId);
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <Link to={`/dataset/${r.datasetId}`} className="font-medium text-slate-800 hover:underline">
                      {ds?.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      For {r.requesterDepartment} — “{r.reason}”
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {myModelRequests.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Heavy-model requests</h3>
          <div className="space-y-2 text-sm">
            {myModelRequests.map((m) => {
              const ds = store.datasets.find((d) => d.id === m.datasetId);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span>
                    <strong>{m.modelName}</strong> on {ds?.name}
                  </span>
                  <StatusBadge status={m.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
