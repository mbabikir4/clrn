// Prominent mocked security banner. Shown when the logged-in user is flagged
// (via dummy toggle) as NOT on the corporate network. No real network detection.
import type { User } from '../types';

export function SecurityBanner({ user }: { user: User }) {
  if (!user.offNetwork) return null;
  return (
    <div className="border-b border-brand-700 bg-brand-700 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm">
        <span className="text-lg" aria-hidden>
          ⚠️
        </span>
        <p className="font-medium">
          You appear to be <strong>off the corporate network</strong>. Connect on-premises to access
          company data.
        </p>
        <span className="ml-auto rounded bg-white/20 px-2 py-0.5 text-xs">Mocked</span>
      </div>
    </div>
  );
}
