import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { proposalAPI, departmentAPI, stageAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['', 'PENDING', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'COMPLETED'];

function formatCurrency(val) {
  if (val == null) return '—';
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

export default function ProposalList() {
  const [proposals, setProposals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', departmentId: '', status: '', stageId: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin    = user?.role === 'ADMIN';
  const isExec     = user?.role === 'EXECUTIVE_USER';
  const isAccounts = user?.role === 'ACCOUNTS_USER';

  useEffect(() => {
    Promise.all([
      departmentAPI.getAll(),
      stageAPI.getAll(),
    ]).then(([deptRes, stageRes]) => {
      setDepartments(deptRes.data);
      setStages(stageRes.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search)      params.search       = filters.search;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.status)       params.status       = filters.status;
    if (filters.stageId)      params.stageId      = filters.stageId;

    proposalAPI.getAll(params)
      .then(res => setProposals(res.data))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  // Role-based header label
  const listTitle = isExec
    ? 'Executive Department Proposals'
    : isAccounts
      ? 'Accounts Department Proposals'
      : 'All Proposals';

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{listTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{proposals.length} proposals found</p>
        </div>
        {(isAdmin || isExec) && (
          <Link
            to="/proposals/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </Link>
        )}
      </div>

      {/* Role badge info */}
      {(isExec || isAccounts) && (
        <div className="px-4 py-2 rounded-lg text-xs font-medium border flex items-center gap-2"
          style={{
            backgroundColor: isExec ? '#eff6ff' : '#ecfeff',
            borderColor: isExec ? '#bfdbfe' : '#a5f3fc',
            color: isExec ? '#2563eb' : '#0891b2'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Showing proposals filtered for your role: {isExec ? 'Executive Department' : 'Accounts Department'}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Search</label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Proposal no. or title..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s === '' ? 'All Statuses' : s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Stage filter only for Admin */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Current Stage</label>
              <select
                value={filters.stageId}
                onChange={(e) => handleFilterChange('stageId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.stageName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-medium">No proposals found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Proposal No.</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Offered Price</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Stage</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Days</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {proposals.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/proposals/${p.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-blue-700">{p.proposalNumber}</span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="truncate font-medium text-slate-700">{p.proposalTitle}</p>
                      <p className="text-xs text-slate-400 truncate">{p.department?.name}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {p.productName ? (
                        <div>
                          <p className="font-medium text-slate-700">{p.productName}</p>
                          {p.productQuantity && <p className="text-xs text-slate-400">Qty: {p.productQuantity.toLocaleString('en-IN')}</p>}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {p.offeredPrice ? (
                        <div>
                          <p className="font-semibold text-blue-700">{formatCurrency(p.offeredPrice)}</p>
                          {p.priceDifference != null && (
                            <p className={`text-xs ${parseFloat(p.priceDifference) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              Diff: {parseFloat(p.priceDifference) >= 0 ? '+' : ''}{formatCurrency(p.priceDifference)}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {p.currentStage ? (
                        <span className="text-slate-700">{p.currentStage.stageName}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${p.totalDaysSpent > 30 ? 'text-red-600' : p.totalDaysSpent > 15 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.totalDaysSpent}d
                      </span>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/proposals/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
