import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard':        'Dashboard',
  '/proposals':        'All Proposals',
  '/proposals/create': 'Create Proposal',
  '/proposals/move':   'Move Proposal',
  '/reports':          'Reports & Analytics',
  '/admin/users':      'User Management',
};

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Finance Works';
  for (const [key, val] of Object.entries(pageTitles)) {
    if (path === key || (path.startsWith(key) && path[key.length] === '/')) {
      title = val;
      break;
    }
  }
  if (path.match(/^\/proposals\/\d+$/))       title = 'Proposal Details';
  if (path.match(/^\/proposals\/\d+\/move$/)) title = 'Move Proposal';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
  });

  return (
    <header
      className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-7 py-3 flex items-center justify-between sticky top-0 z-30 min-h-[52px]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Toggle navigation menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-bold text-slate-800 leading-tight truncate">{title}</h2>
          <p className="text-[0.6875rem] text-slate-400 mt-0.5 leading-tight hidden sm:block">
            Finance Dept · North Western Railway
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="text-[0.75rem] text-slate-400 hidden md:block">{dateStr}</span>
        <div className="h-4 w-px bg-slate-200 hidden md:block" />
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[0.6875rem] font-semibold border border-emerald-100 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="hidden sm:inline">Online</span>
          <span className="sm:hidden">●</span>
        </div>
      </div>
    </header>
  );
}
