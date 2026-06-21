import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/proposals': 'All Proposals',
  '/proposals/create': 'Create New Proposal',
  '/proposals/move': 'Move Proposal',
  '/reports': 'Reports & Analytics',
};

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;

  // Find matching title (handle dynamic routes)
  let title = 'Finance Works Monitoring';
  for (const [key, val] of Object.entries(pageTitles)) {
    if (path.startsWith(key) && (key === path || path === key)) {
      title = val;
      break;
    }
  }
  if (path.match(/^\/proposals\/\d+$/)) title = 'Proposal Details';
  if (path.match(/^\/proposals\/\d+\/move$/)) title = 'Move Proposal';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Finance Department · North Western Railway</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{dateStr}</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Online
        </div>
      </div>
    </header>
  );
}
