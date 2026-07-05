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
  const [proposals, setProposals]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stages, setStages]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ search: '', departmentId: '', status: '', stageId: '' });
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
    if (filters.search)       params.search       = filters.search;
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

  const listTitle = isExec
    ? 'Executive Department Proposals'
    : isAccounts
      ? 'Accounts Department Proposals'
      : 'All Proposals';

  return (
    <div className="space-y-5 fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[1rem] font-bold text-slate-800">{listTitle}</h2>
          <p className="text-[0.75rem] text-slate-400 mt-0.5">{proposals.length} proposals found</p>
        </div>
        {(isAdmin || isExec) && (
          <Link
            to="/proposals/create"
            className="btn btn-primary flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </Link>
        )}
      </div>

      {/* ── Role Notice ── */}
      {(isExec || isAccounts) && (
        <div
          className="px-4 py-2.5 rounded-lg text-[0.75rem] font-medium border flex items-center gap-2"
          style={{
            backgroundColor: isExec ? '#eff6ff' : '#ecfeff',
            borderColor: isExec ? '#bfdbfe' : '#a5f3fc',
            color: isExec ? '#2563eb' : '#0891b2'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Showing proposals filtered for your role: {isExec ? 'Executive Department' : 'Accounts Department'}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="form-label">Search</label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Proposal no. or title…"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              className="form-select"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-select"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s === '' ? 'All Statuses' : s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div>
              <label className="form-label">Stage</label>
              <select
                value={filters.stageId}
                onChange={(e) => handleFilterChange('stageId', e.target.value)}
                className="form-select"
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

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-semibold text-sm">No proposals found</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proposal No.</th>
                  <th>Title / Department</th>
                  <th>Product</th>
                  <th>Offered Price</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th className="text-center">Days</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/proposals/${p.id}`)}
                  >
                    <td>
                      <span className="font-mono font-bold text-blue-700 text-[0.8125rem]">
                        {p.proposalNumber}
                      </span>
                    </td>
                    <td className="max-w-[220px]">
                      <p className="font-semibold text-slate-800 truncate text-[0.8125rem]">{p.proposalTitle}</p>
                      <p className="text-[0.6875rem] text-slate-400 truncate mt-0.5">{p.department?.name}</p>
                    </td>
                    <td>
                      {p.productName ? (
                        <div>
                          <p className="font-medium text-slate-700 text-[0.8125rem]">{p.productName}</p>
                          {p.productQuantity && (
                            <p className="text-[0.6875rem] text-slate-400 mt-0.5">
                              Qty: {p.productQuantity.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td>
                      {p.offeredPrice ? (
                        <div>
                          <p className="font-bold text-blue-700 text-[0.8125rem]">{formatCurrency(p.offeredPrice)}</p>
                          {p.priceDifference != null && (
                            <p className={`text-[0.6875rem] mt-0.5 ${parseFloat(p.priceDifference) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {parseFloat(p.priceDifference) >= 0 ? '+' : ''}{formatCurrency(p.priceDifference)}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td>
                      {p.currentStage ? (
                        <span className="text-[0.8125rem] text-slate-600">{p.currentStage.stageName}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-center">
                      <span className={`font-bold text-[0.8125rem] tabular-nums ${
                        p.totalDaysSpent > 30 ? 'text-red-600'
                        : p.totalDaysSpent > 15 ? 'text-amber-600'
                        : 'text-slate-600'
                      }`}>
                        {p.totalDaysSpent}d
                      </span>
                    </td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/proposals/${p.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View
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
