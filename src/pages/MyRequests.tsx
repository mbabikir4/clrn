// Consumer view of their own clearance + model requests and live status.
import { Link } from 'react-router-dom';
import { currentUser, useStore } from '../db/store';
import { Empty, SectionTitle, StatusBadge } from '../components/ui';
import { ClearanceTimeline } from '../components/ClearanceTimeline';

export function MyRequests() {
  const store = useStore();
  const me = currentUser(store)!;
  const myRequests = store.requests.filter((r) => r.requesterId === me.id);
  const myModelRequests = store.modelRequests.filter((m) => m.requesterId === me.id);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="My requests"
        subtitle="Track your clearance requests through Supervisor → Risk → Governance."
      />

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Clearance requests</h3>
        {myRequests.length === 0 ? (
          <Empty>
            You have no clearance requests. Find data in the{' '}
            <Link to="/marketplace" className="text-brand-600 underline">
              marketplace
            </Link>
            .
          </Empty>
        ) : (
          <div className="space-y-4">
            {myRequests.map((r) => {
              const ds = store.datasets.find((d) => d.id === r.datasetId);
              return (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      to={`/dataset/${r.datasetId}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {ds?.name}
                    </Link>
                    <StatusBadge status={r.currentStage} />
                  </div>
                  <ClearanceTimeline request={r} users={store.users} />
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
