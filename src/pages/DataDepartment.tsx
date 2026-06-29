// Data Department console: approve/deny requests to enable heavy/large AI models
// on a dataset. Approval makes the model available on that dataset.
import { useState } from 'react';
import { currentUser, useStore, userById } from '../db/store';
import { Empty, SectionTitle, StatusBadge, UserName } from '../components/ui';

export function DataDepartment() {
  const store = useStore();
  const me = currentUser(store)!;
  const pending = store.modelRequests.filter((m) => m.status === 'pending');
  const decided = store.modelRequests.filter((m) => m.status !== 'pending');

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Data Department"
        subtitle="Approve heavy AI models per dataset."
      />

      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Pending model requests</h3>
        {pending.length === 0 ? (
          <Empty>No heavy-model requests awaiting review.</Empty>
        ) : (
          <div className="space-y-4">
            {pending.map((m) => (
              <ModelCard key={m.id} request={m} approverId={me.id} />
            ))}
          </div>
        )}
      </div>

      {decided.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Decision history</h3>
          <div className="space-y-2 text-sm">
            {decided.map((m) => {
              const ds = store.datasets.find((d) => d.id === m.datasetId);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span>
                    <strong>{m.modelName}</strong> on {ds?.name} —{' '}
                    <UserName user={userById(store.users, m.requesterId)} id={m.requesterId} />
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

function ModelCard({
  request,
  approverId,
}: {
  request: { id: string; datasetId: string; requesterId: string; modelName: string };
  approverId: string;
}) {
  const store = useStore();
  const [note, setNote] = useState('');
  const ds = store.datasets.find((d) => d.id === request.datasetId);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-800">{request.modelName}</div>
          <div className="text-sm text-slate-500">
            On <strong>{ds?.name}</strong> • requested by{' '}
            <UserName user={userById(store.users, request.requesterId)} id={request.requesterId} />
          </div>
        </div>
        <div className="w-full max-w-xs">
          <input
            className="input mb-2"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn-danger flex-1"
              onClick={() =>
                store.decideModelRequest(request.id, approverId, 'denied', note || 'Denied.')
              }
            >
              Deny
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() =>
                store.decideModelRequest(request.id, approverId, 'approved', note || 'Approved.')
              }
            >
              Approve & enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
