import { useEffect, useState } from 'react';
import { userAPI } from '../api/services';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLE_LABELS = {
  ADMIN: 'Administrator',
  EXECUTIVE_USER: 'Executive User',
  ACCOUNTS_USER: 'Accounts User',
};

const ROLE_COLORS = {
  ADMIN: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  EXECUTIVE_USER: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  ACCOUNTS_USER: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function RoleBadge({ role }) {
  const colors = ROLE_COLORS[role] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {ROLE_LABELS[role] || role}
    </span>
  );
}

const CREDENTIALS = {
  ADMIN: { username: 'admin', password: 'admin123' },
  EXECUTIVE_USER: { username: 'executive', password: 'exec123' },
  ACCOUNTS_USER: { username: 'accounts', password: 'acct123' },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userAPI.getAll()
      .then(res => setUsers(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">User Management</h2>
        <p className="text-slate-500 text-sm mt-0.5">System users and their assigned roles</p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length;
          const colors = ROLE_COLORS[role];
          return (
            <div key={role} className={`p-5 rounded-2xl border ${colors.bg} border-opacity-50`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{label}</p>
              </div>
              <p className={`text-3xl font-bold ${colors.text}`}>{count}</p>
              <p className="text-xs text-slate-500 mt-1">{count === 1 ? 'user' : 'users'}</p>
            </div>
          );
        })}
      </div>

      {/* Credentials Reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-2">Login Credentials</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CREDENTIALS).map(([role, creds]) => (
                <div key={role} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium mb-1">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-slate-600 font-mono">user: <span className="font-semibold">{creds.username}</span></p>
                  <p className="text-xs text-slate-600 font-mono">pass: <span className="font-semibold">{creds.password}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">All Users</h3>
          <span className="text-sm text-slate-500">{users.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Username</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: u.role === 'ADMIN' ? '#f59e0b' : u.role === 'EXECUTIVE_USER' ? '#3b82f6' : '#10b981' }}
                    >
                      {u.fullName?.charAt(0) || u.username?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{u.fullName || u.username}</p>
                      <p className="text-xs text-slate-400">{u.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-slate-600">{u.username}</span>
                </td>
                <td className="px-5 py-4">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-5 py-4 text-slate-500">{u.email || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">Full Access</span>
                    )}
                    {(u.role === 'ADMIN' || u.role === 'EXECUTIVE_USER') && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">Create Proposals</span>
                    )}
                    {(u.role === 'ADMIN' || u.role === 'EXECUTIVE_USER') && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full">Move Proposals</span>
                    )}
                    {(u.role === 'ADMIN' || u.role === 'ACCOUNTS_USER') && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-600 rounded-full">Approve/Reject</span>
                    )}
                    {(u.role === 'ADMIN' || u.role === 'ACCOUNTS_USER') && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-600 rounded-full">View Reports</span>
                    )}
                    {u.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-600 rounded-full">User Management</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Permissions Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Role Permissions Reference</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            {
              role: 'ADMIN',
              label: 'Administrator',
              perms: ['View all proposals', 'Create proposals', 'Move proposals (any stage)', 'Approve / Reject / Return', 'View reports', 'User management', 'Full dashboard access'],
            },
            {
              role: 'EXECUTIVE_USER',
              label: 'Executive User',
              perms: ['View Executive Dept. proposals', 'Create proposals', 'Move to Accounts Dept. only', 'Dashboard access'],
            },
            {
              role: 'ACCOUNTS_USER',
              label: 'Accounts User',
              perms: ['View Accounts Dept. proposals', 'Approve proposals', 'Return proposals', 'Reject proposals', 'Mark as Completed', 'View reports', 'Dashboard access'],
            },
          ].map(({ role, label, perms }) => {
            const colors = ROLE_COLORS[role];
            return (
              <div key={role} className={`rounded-xl p-4 border ${colors.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <p className={`font-semibold text-sm ${colors.text}`}>{label}</p>
                </div>
                <ul className="space-y-1.5">
                  {perms.map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
