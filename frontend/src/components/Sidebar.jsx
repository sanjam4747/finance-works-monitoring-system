import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  ADMIN:          'Administrator',
  EXECUTIVE_USER: 'Executive User',
  ACCOUNTS_USER:  'Accounts User',
};

const ROLE_COLORS = {
  ADMIN:          '#f59e0b',
  EXECUTIVE_USER: '#3b82f6',
  ACCOUNTS_USER:  '#10b981',
};

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-600 select-none">
      {label}
    </p>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role || '';

  const isAdmin    = role === 'ADMIN';
  const isExec     = role === 'EXECUTIVE_USER';
  const isAccounts = role === 'ACCOUNTS_USER';

  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Desktop: always visible; Mobile: slide in/out via translate
  const sidebarClasses = [
    'flex flex-col bg-slate-900 text-white shadow-xl',
    // Desktop: sticky flex item
    'lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-10',
    // Mobile: fixed overlay
    'max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:bottom-0 max-lg:z-50',
    'transition-transform duration-300 ease-in-out',
    // On mobile (< lg), translate it out if not open
    !isOpen ? 'max-lg:-translate-x-full' : 'max-lg:translate-x-0',
  ].join(' ');

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className={sidebarClasses}
      aria-label="Sidebar navigation"
    >
      {/* ── Logo + Mobile Close ── */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-900">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[0.8125rem] font-bold text-white leading-tight tracking-wide">Finance Works</h1>
              <p className="text-[0.6875rem] text-slate-400 leading-tight">Monitoring System</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            <p className="text-[0.6875rem] text-amber-400 font-medium truncate">North Western Railway</p>
          </div>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden -mt-1 -mr-1 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors flex-shrink-0"
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <NavSection label="Main" />

        <NavItem to="/dashboard" label="Dashboard" onClick={onClose} icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        } />

        <NavItem to="/proposals" label="Proposals" onClick={onClose} icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        } />

        {(isAdmin || isExec) && (
          <>
            <NavSection label="Actions" />
            <NavItem to="/proposals/create" label="Create Proposal" onClick={onClose} icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            } />
            <NavItem to="/proposals/move" label="Move Proposal" onClick={onClose} icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            } />
          </>
        )}

        {(isAdmin || isAccounts) && (
          <>
            <NavSection label="Insights" />
            <NavItem to="/reports" label="Reports" onClick={onClose} icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            } />
          </>
        )}

        {isAdmin && (
          <>
            <NavSection label="Administration" />
            <NavItem to="/admin/users" label="User Management" onClick={onClose} icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } />
          </>
        )}
      </nav>

      {/* ── User Profile ── */}
      <div className="px-4 py-4 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: ROLE_COLORS[role] || '#64748b' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-semibold text-white truncate leading-tight">
              {user?.fullName || user?.username}
            </p>
            <p className="text-[0.6875rem] font-medium mt-0.5 truncate" style={{ color: ROLE_COLORS[role] || '#94a3b8' }}>
              {ROLE_LABELS[role] || role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-[0.75rem] text-slate-400 hover:text-white hover:bg-slate-700/70 rounded-lg transition-all duration-150 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
