// Approver queues for the two early gates in the clearance flow:
// Supervisor/Manager sign-off and Risk Management review.
import { useState } from 'react';
import { currentUser, hasRole, useStore, userById } from '../db/store';
import type { AccessRequest, RequestStage } from '../types';
import { Empty, SectionTitle, UserName } from '../components/ui';
import { ClearanceTimeline } from '../components/ClearanceTimeline';

export function Approvals() {
  const store = useStore();
  const me = currentUser(store)!;

  // A user may hold both Supervisor and Risk roles; show whichever queues apply.
  const queues: { stage: RequestStage; title: string; show: boolean; hint: string }[] = [
    {
      stage: 'Supervisor',
      title: 'Supervisor / Manager sign-off',
      show: hasRole(me, 'Supervisor'),
      hint: 'Confirm the requester has a legitimate business need.',
    },
    {
      stage: 'Risk',
      title: 'Risk Management review',
      show: hasRole(me, 'Risk'),
      hint: 'Assess credit/operational risk of granting this access.',
    },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Approvals"
        subtitle="Your queues in the clearance flow. Decisions advance the request to the next gate."
      />
      {queues
        .filter((q) => q.show)
        .map((q) => {
          const items = store.requests.filter((r) => r.currentStage === q.stage);
          return (
            <div key={q.stage} className="card p-6">
              <h3 className="font-semibold text-slate-900">{q.title}</h3>
              <p className="mb-4 text-sm text-slate-500">{q.hint}</p>
              {items.length === 0 ? (
                <Empty>Nothing awaiting your decision.</Empty>
              ) : (
                <div className="space-y-4">
                  {items.map((r) => (
                    <RequestCard key={r.id} request={r} approverId={me.id} stage={q.stage} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function RequestCard({
  request,
  approverId,
  stage,
}: {
  request: AccessRequest;
  approverId: string;
  stage: RequestStage;
}) {
  const store = useStore();
  const [note, setNote] = useState('');
  const ds = store.datasets.find((d) => d.id === request.datasetId);
  const requester = userById(store.users, request.requesterId);
  // For supervisor stage, flag whether the approver is the requester's direct manager.
  const isDirectManager = stage === 'Supervisor' && requester?.supervisorId === approverId;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-800">{ds?.name}</div>
          <div className="text-sm text-slate-500">
            Requested by <UserName user={requester} id={request.requesterId} /> •{' '}
            {requester?.department}
          </div>
          <p className="mt-1 text-sm text-slate-600">“{request.reason}”</p>
          {stage === 'Supervisor' && (
            <span
              className={`badge mt-1 ${
                isDirectManager ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isDirectManager ? 'You are the direct manager' : 'Delegated sign-off'}
            </span>
          )}
        </div>
        <div className="w-full max-w-xs">
          <input
            className="input mb-2"
            placeholder="Decision note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="btn-danger flex-1"
              onClick={() =>
                store.decideClearanceStep(request.id, approverId, 'denied', note || 'Denied.')
              }
            >
              Deny
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() =>
                store.decideClearanceStep(request.id, approverId, 'approved', note || 'Approved.')
              }
            >
              Approve
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <ClearanceTimeline request={request} users={store.users} />
      </div>
    </div>
  );
}
