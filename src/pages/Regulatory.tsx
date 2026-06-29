// Regulatory & Compliance module (mocked, PoC stub). Region is configurable and
// defaults to a Saudi Arabia (SAMA / PDPL) profile. Runs mocked pass/flag checks
// across every dataset.
import { currentUser, useStore } from '../db/store';
import { REGION_PROFILES, runComplianceChecks } from '../services/mocks';
import { PocStub, SectionTitle } from '../components/ui';

export function Regulatory() {
  const store = useStore();
  currentUser(store); // ensures auth context
  const regionKey = store.session.regionKey;
  const profile = REGION_PROFILES[regionKey] ?? REGION_PROFILES.KSA;

  const reports = store.datasets.map((d) => ({
    dataset: d,
    report: runComplianceChecks(d.id, d.sensitivity, regionKey),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="Regulatory & Compliance"
          subtitle="Mocked regulatory checks returning pass/flag results."
        />
        <div className="flex items-center gap-2">
          <PocStub>PoC stub — no real checks</PocStub>
          <select
            className="input max-w-xs"
            value={regionKey}
            onChange={(e) => store.setRegion(e.target.value)}
          >
            {Object.entries(REGION_PROFILES).map(([key, p]) => (
              <option key={key} value={key}>
                {p.region} ({p.profile})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
        Active profile: <strong>{profile.region}</strong> — {profile.profile}. Controls evaluated:{' '}
        {profile.controls.length}. Default region is Saudi Arabia (SAMA / PDPL-style).
      </div>

      <div className="space-y-4">
        {reports.map(({ dataset, report }) => {
          const flags = report.checks.filter((c) => c.result === 'flag').length;
          return (
            <div key={dataset.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold text-slate-900">{dataset.name}</div>
                {flags > 0 ? (
                  <span className="badge bg-rose-100 text-rose-700">{flags} flag(s)</span>
                ) : (
                  <span className="badge bg-emerald-100 text-emerald-700">All controls pass</span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {report.checks.map((c) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
