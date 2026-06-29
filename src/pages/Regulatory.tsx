// Regulatory & Compliance module (mocked, PoC stub). Region is configurable and
// defaults to a Saudi Arabia (SAMA / PDPL) profile. Slimmed to a compact
// pass/flag summary per dataset, expandable for detail.
import { useState } from 'react';
import { useStore } from '../db/store';
import { REGION_PROFILES, runComplianceChecks } from '../services/mocks';
import { PocStub, SectionTitle } from '../components/ui';

export function Regulatory() {
  const store = useStore();
  const regionKey = store.session.regionKey;
  const profile = REGION_PROFILES[regionKey] ?? REGION_PROFILES.KSA;
  const [openId, setOpenId] = useState<string | null>(null);

  const reports = store.datasets.map((d) => ({
    dataset: d,
    report: runComplianceChecks(d.id, d.sensitivity, regionKey),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="Regulatory & Compliance"
          subtitle="Mocked pass/flag controls per dataset."
        />
        <div className="flex items-center gap-2">
          <PocStub>PoC stub — no real checks</PocStub>
          <select className="input max-w-xs" value={regionKey} onChange={(e) => store.setRegion(e.target.value)}>
            {Object.entries(REGION_PROFILES).map(([key, p]) => (
              <option key={key} value={key}>
                {p.region} ({p.profile})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
        Active profile: <strong>{profile.region}</strong> — {profile.profile}. {profile.controls.length}{' '}
        controls. Default is Saudi Arabia (SAMA / PDPL-style).
      </div>

      {/* Compact one-line summary per dataset, expandable */}
      <div className="card divide-y divide-slate-100">
        {reports.map(({ dataset, report }) => {
          const flags = report.checks.filter((c) => c.result === 'flag').length;
          const open = openId === dataset.id;
          return (
            <div key={dataset.id}>
              <button
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
                onClick={() => setOpenId(open ? null : dataset.id)}
              >
                <span className="font-medium text-slate-800">{dataset.name}</span>
                <span className="flex items-center gap-2">
                  {flags > 0 ? (
                    <span className="badge bg-slate-200 text-slate-600">{flags} flag(s)</span>
                  ) : (
                    <span className="badge bg-brand-100 text-brand-700">All pass</span>
                  )}
                  <span className="text-slate-400">{open ? '▲' : '▼'}</span>
                </span>
              </button>
              {open && (
                <div className="grid gap-2 px-5 pb-4 sm:grid-cols-2">
                  {report.checks.map((c) => (
                    <div
                      key={c.control}
                      className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm"
                    >
                      <span className={c.result === 'pass' ? 'text-brand-600' : 'text-slate-700'}>
                        {c.result === 'pass' ? '✓' : '⚠'}
                      </span>
                      <div>
                        <div className="text-slate-700">{c.control}</div>
                        <div className="text-xs text-slate-400">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
