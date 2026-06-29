// Dummy login: Work ID + password → mocked 2-factor step. No real auth backend.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../db/store';
import { ROLE_LABEL } from '../lib/labels';
import { RoleBadge } from '../components/ui';

// Curated demo accounts surfaced as quick-login chips.
const DEMO_ACCOUNTS = [
  'WID-1001',
  'WID-1010',
  'WID-2001',
  'WID-3001',
  'WID-4001',
  'WID-9001',
  'WID-1003',
];

export function Login() {
  const store = useStore();
  const navigate = useNavigate();
  const [workId, setWorkId] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const twoFactor = store.session.twoFactorPending;
  const candidate = store.users.find((u) => u.id === store.session.userId);

  function submitCreds(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = store.login(workId, password);
    if (!res.ok) setError(res.error ?? 'Login failed.');
  }

  function submit2fa(value: string) {
    setError('');
    const res = store.verifyTwoFactor(value);
    if (!res.ok) setError(res.error ?? '2FA failed.');
    else navigate('/marketplace');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand / context */}
      <div className="hidden flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">▦</span>
          CLR Data Marketplace
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Governed, group-based access to internal data.
          </h1>
          <p className="mt-4 text-brand-50">
            Every employee can publish and consume data — but access is always governed. Governance
            completes a checklist and decides which departments and roles may view each dataset.
          </p>
          <p className="mt-6 text-sm text-brand-100">
            Proof of concept. All accounts, data, approvals and compliance checks are mocked.
          </p>
        </div>
        <div className="text-xs text-brand-100">Demo password for every account: “demo”.</div>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="card w-full max-w-md p-8">
          {!twoFactor ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Use a demo Work ID and password “demo”.</p>
              <form onSubmit={submitCreds} className="mt-6 space-y-4">
                <div>
                  <label className="label">Work ID</label>
                  <input
                    className="input"
                    placeholder="WID-1001"
                    value={workId}
                    onChange={(e) => setWorkId(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="demo"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-slate-700">{error}</p>}
                <button className="btn-primary w-full" type="submit">
                  Continue
                </button>
              </form>

              <div className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Quick demo logins
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((id) => {
                    const u = store.users.find((x) => x.id === id)!;
                    return (
                      <button
                        key={id}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-xs hover:bg-slate-50"
                        onClick={() => {
                          setWorkId(id);
                          setPassword('demo');
                        }}
                        title={u.roles.map((r) => ROLE_LABEL[r]).join(', ')}
                      >
                        <div className="font-medium text-slate-700">{u.id}</div>
                        <div className="text-slate-400">{u.roles[0] && ROLE_LABEL[u.roles[0]]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900">Two-factor verification</h2>
              <p className="mt-1 text-sm text-slate-500">
                A push was sent to {candidate?.name}'s device. Enter <strong>any</strong> code or
                approve the push — this is a mocked 2FA step.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {candidate?.roles.map((r) => (
                  <RoleBadge key={r} role={r} />
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label">Verification code</label>
                  <input
                    className="input tracking-widest"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-slate-700">{error}</p>}
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => submit2fa(code)}>
                    Verify code
                  </button>
                  <button className="btn-primary flex-1" onClick={() => submit2fa('approve')}>
                    ✓ Approve push
                  </button>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600"
                  onClick={() => store.logout()}
                >
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
