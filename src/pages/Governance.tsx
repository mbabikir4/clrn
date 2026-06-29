// Governance-only console: define ACLs for newly submitted datasets, give final
// approval on clearance requests (which adds the person to the ACL), and manage
// per-dataset access lists. This is the central access-control surface.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { currentUser, useStore, userById } from '../db/store';
import type { Dataset } from '../types';
import { ClearanceBadge, Empty, SectionTitle, UserName } from '../components/ui';
import { ClearanceTimeline } from '../components/ClearanceTimeline';

export function Governance() {
  const store = useStore();
  const me = currentUser(store)!;

  const pending = store.datasets.filter((d) => d.status === 'PendingGovernance');
  const published = store.datasets.filter((d) => d.status === 'Published');
  const govRequests = store.requests.filter((r) => r.currentStage === 'Governance');

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Governance console"
        subtitle="Define who can see each dataset and approve access — per person, always."
      />

      {/* 1. Datasets awaiting initial ACL */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Awaiting access definition</h3>
        <p className="mb-4 text-sm text-slate-500">
          Newly submitted datasets. Set the initial access control list, then publish.
        </p>
        {pending.length === 0 ? (
          <Empty>No datasets are waiting for Governance.</Empty>
        ) : (
          <div className="space-y-4">
            {pending.map((d) => (
              <SetAclCard key={d.id} dataset={d} byUserId={me.id} />
            ))}
          </div>
        )}
      </div>

      {/* 2. Clearance requests needing final Governance approval */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Clearance requests for approval</h3>
        <p className="mb-4 text-sm text-slate-500">
          These passed Supervisor and Risk. Approving adds the person to the dataset ACL.
        </p>
        {govRequests.length === 0 ? (
          <Empty>No clearance requests awaiting Governance.</Empty>
        ) : (
          <div className="space-y-4">
            {govRequests.map((r) => {
              const ds = store.datasets.find((d) => d.id === r.datasetId);
              const requester = userById(store.users, r.requesterId);
              return (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800">{ds?.name}</div>
                      <div className="text-sm text-slate-500">
                        Requested by <UserName user={requester} id={r.requesterId} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">“{r.reason}”</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-danger"
                        onClick={() =>
                          store.decideClearanceStep(r.id, me.id, 'denied', 'Denied by Governance.')
                        }
                      >
                        Deny
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          store.decideClearanceStep(
                            r.id,
                            me.id,
                            'approved',
                            'Approved & added to ACL.',
                          )
                        }
                      >
                        Approve & add to ACL
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ClearanceTimeline request={r} users={store.users} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Manage existing ACLs */}
      <div className="card p-6">
        <h3 className="mb-1 font-semibold text-slate-900">Manage access lists</h3>
        <p className="mb-4 text-sm text-slate-500">Add or remove people from any published dataset.</p>
        <div className="space-y-4">
          {published.map((d) => (
            <ManageAclCard key={d.id} dataset={d} byUserId={me.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Card to pick an initial ACL for a pending dataset and publish it. */
function SetAclCard({ dataset, byUserId }: { dataset: Dataset; byUserId: string }) {
  const store = useStore();
  const [selected, setSelected] = useState<string[]>(dataset.acl);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to={`/dataset/${dataset.id}`} className="font-medium text-slate-800 hover:underline">
            {dataset.name}
          </Link>{' '}
          <ClearanceBadge level={dataset.sensitivity} />
          <div className="text-sm text-slate-500">
            {dataset.department} • steward{' '}
            <UserName user={userById(store.users, dataset.stewardId)} id={dataset.stewardId} />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => store.governanceSetAcl(dataset.id, selected, byUserId)}
        >
          Set ACL & publish
        </button>
      </div>
      <div className="mt-3">
        <div className="label">Grant initial access to:</div>
        <div className="flex flex-wrap gap-2">
          {store.users.map((u) => (
            <label
              key={u.id}
              className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs ${
                selected.includes(u.id)
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                className="mr-1 align-middle"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
              />
              {u.name} ({u.id})
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Card to add/remove individuals from a published dataset's ACL. */
function ManageAclCard({ dataset, byUserId }: { dataset: Dataset; byUserId: string }) {
  const store = useStore();
  const [addId, setAddId] = useState('');
  const notOnAcl = store.users.filter((u) => !dataset.acl.includes(u.id));

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/dataset/${dataset.id}`} className="font-medium text-slate-800 hover:underline">
          {dataset.name}
        </Link>
        <div className="flex items-center gap-2">
          <select className="input max-w-xs" value={addId} onChange={(e) => setAddId(e.target.value)}>
            <option value="">Add person…</option>
            {notOnAcl.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>
          <button
            className="btn-ghost"
            disabled={!addId}
            onClick={() => {
              store.governanceAddToAcl(dataset.id, addId, byUserId);
              setAddId('');
            }}
          >
            Add
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {dataset.acl.map((uid) => {
          const u = userById(store.users, uid);
          const isOwner = uid === dataset.ownerId;
          return (
            <span
              key={uid}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            >
              {u?.name ?? uid}
              {isOwner ? (
                <span className="text-slate-400">(owner)</span>
              ) : (
                <button
                  className="text-rose-500 hover:text-rose-700"
                  title="Remove from ACL"
                  onClick={() => store.governanceRemoveFromAcl(dataset.id, uid, byUserId)}
                >
                  ✕
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
