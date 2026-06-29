// Dataset detail: metadata, group-based access, auto-analytics, gated (view-only)
// data preview, inline AI models, heavy-model requests, and a one-step access
// request routed to Governance.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { currentUser, openRequestFor, useStore, userById } from '../db/store';
import { canView } from '../lib/access';
import { runComplianceChecks } from '../services/mocks';
import { ROLE_LABEL } from '../lib/labels';
import {
  ClearanceBadge,
  Empty,
  PocStub,
  SectionTitle,
  StatusBadge,
  UserName,
} from '../components/ui';
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
  const allowed = canView(dataset, user);
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
              <span className="badge bg-slate-100 text-slate-600">View only</span>
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
              <span className="badge bg-brand-100 text-brand-700">You have access</span>
            ) : (
              <span className="badge bg-slate-100 text-slate-600">Access required</span>
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
        <div className="card border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          This dataset is <strong>awaiting Governance</strong> to complete its checklist and define
          which groups may view it. It is not in the catalog yet.
          {user.roles.includes('Governance') && (
            <>
              {' '}
              <Link to="/governance" className="font-medium underline">
                Open the Governance console →
              </Link>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Access panel */}
        <div className="card p-6 lg:col-span-1">
          <SectionTitle title="Access" subtitle="Granted by department / role — not per person." />

          <div className="mb-4">
            <div className="label">Who can view this data</div>
            {dataset.allowedDepartments.length === 0 && dataset.allowedRoles.length === 0 ? (
              <p className="text-sm text-slate-500">
                No groups defined yet — only the owner and Governance can view.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {dataset.allowedDepartments.map((dep) => (
                  <span key={dep} className="badge bg-slate-100 text-slate-700">
                    {dep}
                  </span>
                ))}
                {dataset.allowedRoles.map((r) => (
                  <span key={r} className="badge bg-brand-100 text-brand-700">
                    {r === 'Consumer' ? 'All employees' : ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Governance checklist (read-only here) */}
          <div className="mb-4">
            <div className="label">Governance checklist</div>
            <ul className="space-y-1 text-sm">
              {dataset.governance.map((c) => (
                <li key={c.key} className="flex items-start gap-2">
                  <span className={c.done ? 'text-brand-600' : 'text-slate-300'}>
                    {c.done ? '✓' : '○'}
                  </span>
                  <span className={c.done ? 'text-slate-700' : 'text-slate-400'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="label mb-1">Responsible for clearing</div>
            <UserName user={steward} id={dataset.stewardId} />
          </div>

          {/* Access state */}
          <div className="mt-5">
            {allowed ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                ✓ Your group has access — you can view this data.
              </div>
            ) : openReq ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                ⏳ Access requested for <strong>{openReq.requesterDepartment}</strong> — awaiting
                Governance approval.
              </div>
            ) : dataset.status === 'PendingGovernance' ? (
              <p className="text-sm text-slate-500">
                You can request access once Governance has published this dataset.
              </p>
            ) : (
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">Request access</div>
                <p className="mb-2 text-xs text-slate-500">
                  One step: Governance reviews and, if approved, grants your department (
                  {user.department}) access.
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

        {/* Analytics (auto-generated, aggregate, always visible) */}
        <div className="card p-6 lg:col-span-2">
          <SectionTitle
            title="Automatic analytics"
            subtitle="Generated automatically on upload — no manual pipeline."
          />
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Rows" value={dataset.analytics.rowCount.toLocaleString()} />
            <Stat label="Columns" value={String(dataset.analytics.columnCount)} />
            <Stat label="Completeness" value={`${(dataset.analytics.completeness * 100).toFixed(1)}%`} />
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

      {/* Gated: view-only data preview + inline models + heavy models */}
      <div className="card p-6">
        <SectionTitle
          title="Data preview, AI models & heavy compute"
          subtitle="View-only row-level data and inline models require group access (and corporate network)."
        />

        {!allowed ? (
          <Empty>🔒 Your group doesn't have access yet. Request access to preview the data.</Empty>
        ) : user.offNetwork ? (
          <div className="rounded-lg border border-brand-300 bg-brand-100 p-4 text-sm text-brand-900">
            🔒 Access blocked: you are flagged as off the corporate network. Reconnect to view the
            data. (Mocked network control.)
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="label">Sample rows (dummy data, view only)</div>
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

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="label mb-0">Heavy / large models</span>
                <PocStub>requires Data Dept approval</PocStub>
              </div>
              {dataset.heavyModelsEnabled.length > 0 && (
                <div className="mb-3 text-sm text-brand-700">
                  Enabled on this dataset: {dataset.heavyModelsEnabled.join(', ')}
                </div>
              )}
              {existingModelReq ? (
                <p className="text-sm text-slate-600">
                  Your request for “{existingModelReq.modelName}” is pending Data Department review.
                </p>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1">
                    <label className="label">Model</label>
                    <select className="input" value={modelName} onChange={(e) => setModelName(e.target.value)}>
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
                  {requested && <span className="text-xs text-brand-600">Submitted ✓</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compliance summary (mocked, compact) */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="Regulatory & compliance"
            subtitle={`${compliance?.region} • ${compliance?.profile} profile`}
          />
          <div className="flex items-center gap-2">
            <PocStub>mocked stub</PocStub>
            {flags > 0 ? (
              <span className="badge bg-slate-200 text-slate-600">{flags} flag(s)</span>
            ) : (
              <span className="badge bg-brand-100 text-brand-700">All clear</span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {compliance?.checks.length} controls evaluated, {flags} flagged. Full breakdown in the{' '}
          <Link to="/regulatory" className="underline">
            Regulatory module
          </Link>
          .
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
