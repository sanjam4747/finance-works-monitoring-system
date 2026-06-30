import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  ADMIN: 'Administrator',
  EXECUTIVE_USER: 'Executive User',
  ACCOUNTS_USER: 'Accounts User',
};

const ROLE_COLORS = {
  ADMIN: '#f59e0b',
  EXECUTIVE_USER: '#3b82f6',
  ACCOUNTS_USER: '#10b981',
};

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role || '';

  const isAdmin    = role === 'ADMIN';
  const isExec     = role === 'EXECUTIVE_USER';
  const isAccounts = role === 'ACCOUNTS_USER';

  return (
    <aside
      style={{ width: '260px', minHeight: '100vh' }}
      className="flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Finance Works</h1>
            <p className="text-xs text-slate-400 leading-tight">Monitoring System</p>
          </div>
        </div>
        <p className="text-xs text-amber-400 font-medium mt-2">North Western Railway</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Dashboard — all roles */}
        <NavItem to="/dashboard" label="Dashboard" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        } />

        {/* Proposals — all roles (filtered by role on backend) */}
        <NavItem to="/proposals" label="Proposals" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        } />

        {/* Create Proposal — Admin + Executive */}
        {(isAdmin || isExec) && (
          <NavItem to="/proposals/create" label="Create Proposal" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          } />
        )}

        {/* Move Proposal — Admin + Executive */}
        {(isAdmin || isExec) && (
          <NavItem to="/proposals/move" label="Move Proposal" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          } />
        )}

        {/* Reports — Admin + Accounts */}
        {(isAdmin || isAccounts) && (
          <NavItem to="/reports" label="Reports" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          } />
        )}

        {/* Separator */}
        {isAdmin && <div className="my-2 border-t border-slate-700" />}

        {/* User Management — Admin only */}
        {isAdmin && (
          <NavItem to="/admin/users" label="User Management" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } />
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase text-white"
            style={{ backgroundColor: ROLE_COLORS[role] || '#64748b' }}
          >
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: ROLE_COLORS[role] || '#94a3b8' }}>
              {ROLE_LABELS[role] || role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
