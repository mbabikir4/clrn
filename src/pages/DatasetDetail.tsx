// Dataset detail: metadata, ACL, auto-analytics, gated data preview, inline AI
// models, heavy-model requests, and the consumer clearance flow.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { currentUser, hasAccess, openRequestFor, useStore, userById } from '../db/store';
import { runComplianceChecks } from '../services/mocks';
import {
  ClearanceBadge,
  Empty,
  PocStub,
  SectionTitle,
  StatusBadge,
  UserName,
} from '../components/ui';
import { ClearanceTimeline } from '../components/ClearanceTimeline';
import { CategoryPie, DistributionChart, InlineModelChart, TrendChart } from '../components/Charts';

export function DatasetDetail() {
  const { id } = useParams();
  const store = useStore();
  const user = currentUser(store)!;
  const dataset = store.datasets.find((d) => d.id === id);

  const [reason, setReason] = useState('');
  const [modelName, setModelName] = useState('Deep Churn Predictor (GPU)');
  const [requested, setRequested] = useState(false);

  const compliance = useMemo(
    () => (dataset ? runComplianceChecks(dataset.id, dataset.sensitivity, store.session.regionKey) : null),
    [dataset, store.session.regionKey],
  );

  if (!dataset) {
    return (
      <Empty>
        Dataset not found.{' '}
        <Link to="/marketplace" className="text-brand-600 underline">
          Back to marketplace
        </Link>
      </Empty>
    );
  }

  const owner = userById(store.users, dataset.ownerId);
  const steward = userById(store.users, dataset.stewardId);
  const allowed = hasAccess(dataset, user.id);
  const openReq = openRequestFor(store.requests, dataset.id, user.id);
  const existingModelReq = store.modelRequests.find(
    (m) => m.datasetId === dataset.id && m.requesterId === user.id && m.status === 'pending',
  );
  const flags = compliance?.checks.filter((c) => c.result === 'flag').length ?? 0;

  function submitRequest() {
    if (!reason.trim()) return;
    store.requestAccess(dataset!.id, user.id, reason.trim());
    setReason('');
  }

  return (
    <div className="space-y-6">
      <Link to="/marketplace" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to marketplace
      </Link>

      {/* Header / metadata */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{dataset.name}</h1>
              <ClearanceBadge level={dataset.sensitivity} />
              <StatusBadge status={dataset.status} />
            </div>
            <p className="mt-2 max-w-2xl text-slate-600">{dataset.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {dataset.tags.map((t) => (
                <span key={t} className="badge bg-slate-100 text-slate-500">
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right text-sm">
            {allowed ? (
              <span className="badge bg-emerald-100 text-emerald-700">You have access</span>
            ) : (
              <span className="badge bg-amber-100 text-amber-800">Access required</span>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Owning department">{dataset.department}</Meta>
          <Meta label="Published by">
            <UserName user={owner} id={dataset.ownerId} />
          </Meta>
          <Meta label="Responsible for clearing (steward)">
            <UserName user={steward} id={dataset.stewardId} />
          </Meta>
          <Meta label="Created">{new Date(dataset.createdAt).toLocaleDateString()}</Meta>
        </dl>
      </div>

      {/* Governance pending notice */}
      {dataset.status === 'PendingGovernance' && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This dataset has been submitted and is <strong>awaiting Governance</strong> to define its
          access control list. It is not broadly accessible yet.
          {user.roles.includes('Governance') && (
            <>
              {' '}
              <Link to="/governance" className="font-medium underline">
                Define access in the Governance console →
              </Link>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Access / ACL panel */}
        <div className="card p-6 lg:col-span-1">
          <SectionTitle title="Access control" subtitle="Per-person ACL, governed by Governance." />
          <div className="mb-4">
            <div className="label">Who is allowed to see this data</div>
            {dataset.acl.length === 0 ? (
              <p className="text-sm text-slate-500">No one yet — Governance hasn't set the ACL.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {dataset.acl.map((uid) => {
                  const u = userById(store.users, uid);
                  return (
                    <li key={uid} className="flex items-center justify-between">
                      <UserName user={u} id={uid} />
                      {uid === dataset.ownerId && (
                        <span className="badge bg-sky-100 text-sky-700">owner</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="label mb-1">Responsible for clearing</div>
            <UserName user={steward} id={dataset.stewardId} />
          </div>

          {/* Access state machine */}
          <div className="mt-5">
            {allowed ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                ✓ You are on the ACL — full access granted.
              </div>
            ) : openReq ? (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Clearance request status
                </div>
                <ClearanceTimeline request={openReq} users={store.users} />
              </div>
            ) : dataset.status === 'PendingGovernance' ? (
              <p className="text-sm text-slate-500">
                You can request access once Governance has published this dataset.
              </p>
            ) : (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">Request clearance</div>
                <p className="mb-2 text-xs text-slate-500">
                  Routed: Supervisor → Risk Management → Governance (who adds you to the ACL).
                </p>
                <textarea
                  className="input mb-2"
                  rows={3}
                  placeholder="Business justification…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button className="btn-primary w-full" disabled={!reason.trim()} onClick={submitRequest}>
                  Request access
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics (auto-generated, always visible — aggregate only) */}
        <div className="card p-6 lg:col-span-2">
          <SectionTitle
            title="Automatic analytics"
            subtitle="Generated automatically on upload — no manual pipeline."
          />
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Rows" value={dataset.analytics.rowCount.toLocaleString()} />
            <Stat label="Columns" value={String(dataset.analytics.columnCount)} />
            <Stat
              label="Completeness"
              value={`${(dataset.analytics.completeness * 100).toFixed(1)}%`}
            />
            <Stat label="Sensitivity" value={dataset.sensitivity} />
          </div>
          <p className="mb-4 text-sm text-slate-600">{dataset.analytics.summary}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <ChartCard title="Value distribution">
              <DistributionChart data={dataset.analytics.distribution} />
            </ChartCard>
            <ChartCard title="Trend (8 periods)">
              <TrendChart data={dataset.analytics.trend} />
            </ChartCard>
            <ChartCard title="Segments">
              <CategoryPie data={dataset.analytics.categories} />
            </ChartCard>
          </div>

          {/* Column profile */}
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Column</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Nulls</th>
                  <th className="px-3 py-2">Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataset.analytics.columns.map((c) => (
                  <tr key={c.name}>
                    <td className="px-3 py-1.5 font-medium text-slate-700">{c.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{c.type}</td>
                    <td className="px-3 py-1.5 text-slate-500">{c.nulls.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-slate-500">{c.sample}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gated section: raw data preview + inline models + heavy models */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="Data preview, AI models & heavy compute"
            subtitle="Row-level data and inline models require ACL access (and corporate network)."
          />
        </div>

        {!allowed ? (
          <Empty>
            🔒 Request and obtain clearance to preview row-level data and run inline AI models.
          </Empty>
        ) : user.offNetwork ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            🔒 Access blocked: you are flagged as off the corporate network. Reconnect to view
            row-level data. (Mocked network control.)
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sample data */}
            <div>
              <div className="label">Sample rows (dummy data)</div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      {dataset.sampleColumns.map((c) => (
                        <th key={c} className="px-3 py-2">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataset.sampleRows.map((row, i) => (
                      <tr key={i}>
                        {dataset.sampleColumns.map((c) => (
                          <td key={c} className="px-3 py-1.5 text-slate-600">
                            {row[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inline AI models */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="label mb-0">Inline AI models</span>
                <PocStub>mocked</PocStub>
                <span className="text-xs text-slate-400">Run automatically on the dataset.</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {dataset.inlineModels.map((m) => (
                  <div key={m.name} className="rounded-lg border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-800">{m.name}</div>
                    <div className="text-xs font-medium text-brand-600">{m.headline}</div>
                    <InlineModelChart model={m} />
                    <p className="mt-1 text-xs text-slate-500">{m.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Heavy model request → Data Department */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="label mb-0">Heavy / large models</span>
                <PocStub>requires Data Dept approval</PocStub>
              </div>
              {dataset.heavyModelsEnabled.length > 0 && (
                <div className="mb-3 text-sm text-emerald-700">
                  Enabled on this dataset: {dataset.heavyModelsEnabled.join(', ')}
                </div>
              )}
              {existingModelReq ? (
                <p className="text-sm text-amber-700">
                  Your request for “{existingModelReq.modelName}” is pending Data Department review.
                </p>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1">
                    <label className="label">Model</label>
                    <select
                      className="input"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                    >
                      <option>Deep Churn Predictor (GPU)</option>
                      <option>Large Language Model — document summarizer</option>
                      <option>Graph Neural Network — fraud rings</option>
                      <option>Time-series Transformer — forecasting</option>
                    </select>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      store.requestModel(dataset.id, user.id, modelName);
                      setRequested(true);
                    }}
                  >
                    Request from Data Dept
                  </button>
                  {requested && <span className="text-xs text-emerald-600">Submitted ✓</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compliance summary (mocked) */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="Regulatory & compliance"
            subtitle={`${compliance?.region} • ${compliance?.profile} profile`}
          />
          <div className="flex items-center gap-2">
            <PocStub>mocked stub</PocStub>
            {flags > 0 ? (
              <span className="badge bg-rose-100 text-rose-700">{flags} flags</span>
            ) : (
              <span className="badge bg-emerald-100 text-emerald-700">All clear</span>
            )}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {compliance?.checks.map((c) => (
            <div
              key={c.control}
              className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm"
            >
              <span className={c.result === 'pass' ? 'text-emerald-600' : 'text-rose-600'}>
                {c.result === 'pass' ? '✓' : '⚠'}
              </span>
              <div>
                <div className="text-slate-700">{c.control}</div>
                <div className="text-xs text-slate-400">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Change the region in the <Link to="/regulatory" className="underline">Regulatory module</Link>.
        </p>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-1 text-xs font-medium text-slate-500">{title}</div>
      {children}
    </div>
  );
}
