// App shell: top navigation (role-gated), security banner, and routed content.
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { currentUser, hasRole, useStore } from '../db/store';
import { SecurityBanner } from './SecurityBanner';
import { RoleBadge } from './ui';

interface NavItem {
  to: string;
  label: string;
  show: boolean;
}

export function Layout() {
  const store = useStore();
  const user = currentUser(store);
  const navigate = useNavigate();

  if (!user) {
    // Guard: not authenticated → bounce to login (declarative redirect).
    return <Navigate to="/login" replace />;
  }

  // Count actionable items per role for nav badges.
  const pendingForGovernance = store.datasets.filter((d) => d.status === 'PendingGovernance').length;
  const govQueue = store.requests.filter((r) => r.status === 'pending').length;
  const modelQueue = store.modelRequests.filter((r) => r.status === 'pending').length;

  const items: NavItem[] = [
    { to: '/marketplace', label: 'Marketplace', show: true },
    { to: '/publish', label: 'Publish', show: hasRole(user, 'Provider') },
    { to: '/requests', label: 'My Requests', show: true },
    {
      to: '/governance',
      label: `Governance${pendingForGovernance + govQueue ? ` (${pendingForGovernance + govQueue})` : ''}`,
      show: hasRole(user, 'Governance'),
    },
    {
      to: '/data-department',
      label: `Data Dept${modelQueue ? ` (${modelQueue})` : ''}`,
      show: hasRole(user, 'DataDept'),
    },
    { to: '/regulatory', label: 'Regulatory', show: true },
    { to: '/admin', label: 'Admin', show: hasRole(user, 'Admin') },
    { to: '/profile', label: 'Profile', show: true },
  ];

  return (
    <div className="min-h-screen">
      <SecurityBanner user={user} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <NavLink to="/marketplace" className="flex items-center gap-2 font-bold text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              ▦
            </span>
            CLR Data Marketplace
            <span className="badge bg-slate-100 text-slate-500">PoC</span>
          </NavLink>
          <nav className="ml-4 hidden flex-wrap gap-1 md:flex">
            {items
              .filter((i) => i.show)
              .map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {i.label}
                </NavLink>
              ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{user.department}</div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => {
                store.logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex flex-wrap gap-1 border-t border-slate-100 px-4 py-2 md:hidden">
          {items
            .filter((i) => i.show)
            .map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1 text-xs font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
                  }`
                }
              >
                {i.label}
              </NavLink>
            ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Acting as:</span>
          {user.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
        <Outlet />
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-slate-400">
        CLR Data Marketplace — proof of concept. All data, users, approvals, analytics, AI results
        and compliance checks are mocked. Not for production use.
      </footer>
    </div>
  );
}
