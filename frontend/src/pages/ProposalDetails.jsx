import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { proposalAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatCurrency(val) {
  if (val == null) return '—';
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const STATUS_ACTIONS = [
  { label: 'Approve',  status: 'APPROVED',  colorClass: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700' },
  { label: 'Complete', status: 'COMPLETED', colorClass: 'bg-blue-600 hover:bg-blue-700 border-blue-700' },
  { label: 'Return',   status: 'RETURNED',  colorClass: 'bg-amber-500 hover:bg-amber-600 border-amber-600' },
  { label: 'Reject',   status: 'REJECTED',  colorClass: 'bg-red-600 hover:bg-red-700 border-red-700' },
];

function InfoField({ label, children }) {
  return (
    <div>
      <p className="text-[0.6875rem] text-slate-400 font-medium mb-1 uppercase tracking-wide">{label}</p>
      <div className="text-[0.8125rem] font-semibold text-slate-800">{children}</div>
    </div>
  );
}

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proposal, setProposal]           = useState(null);
  const [movements, setMovements]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg]         = useState('');

  const isAdmin    = user?.role === 'ADMIN';
  const isAccounts = user?.role === 'ACCOUNTS_USER';
  const canUpdateStatus = isAdmin || isAccounts;
  const canMove    = isAdmin || user?.role === 'EXECUTIVE_USER';

  useEffect(() => {
    Promise.all([
      proposalAPI.getById(id),
      proposalAPI.getMovements(id),
    ]).then(([propRes, movRes]) => {
      setProposal(propRes.data);
      setMovements(movRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (status) => {
    setStatusUpdating(true);
    setStatusMsg('');
    try {
      const res = await proposalAPI.updateStatus(id, status);
      setProposal(res.data);
      setStatusMsg(`Status updated to ${status.replace('_', ' ')} successfully.`);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading proposal details…" />;
  if (!proposal) return <div className="text-center py-20 text-slate-500">Proposal not found.</div>;

  const totalDays = movements.reduce((acc, m) => acc + (m.daysSpent || 0), 0);
  const isFinished = ['COMPLETED', 'APPROVED', 'REJECTED'].includes(proposal.status);

  return (
    <div className="space-y-5 w-full max-w-5xl fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[0.8125rem] mb-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Proposals
          </button>
          <h2 className="text-[1rem] font-bold text-slate-800 leading-tight">{proposal.proposalTitle}</h2>
          <p className="text-[0.75rem] text-slate-400 mt-1 font-mono">{proposal.proposalNumber}</p>
        </div>
        {canMove && !isFinished && (
          <Link
            to={`/proposals/${id}/move`}
            className="btn btn-primary flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Move Proposal
          </Link>
        )}
      </div>

      {/* ── Quick Info Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Submitting Dept.',   value: proposal.department?.name },
          { label: 'Current Stage',      value: proposal.currentStage?.stageName || 'N/A' },
          { label: 'Submission Date',    value: formatDate(proposal.submissionDate) },
          { label: 'Total Days Elapsed', value: `${totalDays} days` },
        ].map(info => (
          <div key={info.label} className="card p-4">
            <p className="text-[0.6875rem] text-slate-400 font-medium uppercase tracking-wide mb-1">{info.label}</p>
            <p className="text-[0.875rem] font-bold text-slate-800">{info.value}</p>
          </div>
        ))}
      </div>

      {/* ── Proposal Information ── */}
      <div className="card p-6">
        <h3 className="text-[0.875rem] font-bold text-slate-800 mb-4">Proposal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoField label="Status">
            <StatusBadge status={proposal.status} />
          </InfoField>
          {proposal.createdByFullName && (
            <InfoField label="Submitted By">{proposal.createdByFullName}</InfoField>
          )}
          {proposal.completionDate && (
            <InfoField label="Completion Date">
              {formatDate(proposal.completionDate)}
            </InfoField>
          )}
          {proposal.remarks && (
            <div className="col-span-2">
              <p className="text-[0.6875rem] text-slate-400 font-medium mb-1 uppercase tracking-wide">Remarks</p>
              <p className="text-[0.8125rem] text-slate-700 leading-relaxed">{proposal.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Items / Products (Phase 1) ── */}
      {proposal.items && proposal.items.length > 0 && (
        <div className="card p-6">
          <h3 className="text-[0.875rem] font-bold text-slate-800 mb-4">
            Items / Products
            <span className="ml-2 text-slate-400 font-normal text-xs">({proposal.items.length} item{proposal.items.length !== 1 ? 's' : ''})</span>
          </h3>

          <div className="table-scroll-wrapper">
            <table className="w-full text-[0.8125rem] border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Item Name</th>
                  <th className="text-right py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
                  <th className="text-right py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Offered Price</th>
                  <th className="text-right py-2 pr-4 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Market Price</th>
                  <th className="text-right py-2 text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wide">Difference</th>
                </tr>
              </thead>
              <tbody>
                {proposal.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{item.itemName}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{item.quantity?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.unit || '—'}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-blue-700 font-medium">
                      {formatCurrency(item.offeredPrice)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {formatCurrency(item.marketPrice)}
                    </td>
                    <td className={`py-2.5 text-right tabular-nums font-semibold ${
                      item.priceDifference == null ? 'text-slate-400' :
                      parseFloat(item.priceDifference) >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {item.priceDifference != null ? formatCurrency(item.priceDifference) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aggregate totals */}
          {(proposal.totalOfferedPrice || proposal.totalMarketPrice) && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-[0.8125rem]">
              {proposal.totalOfferedPrice && (
                <div>
                  <span className="text-slate-500 font-medium">Total Offered: </span>
                  <span className="font-bold text-blue-700">{formatCurrency(proposal.totalOfferedPrice)}</span>
                </div>
              )}
              {proposal.totalMarketPrice && (
                <div>
                  <span className="text-slate-500 font-medium">Total Market: </span>
                  <span className="font-bold text-slate-800">{formatCurrency(proposal.totalMarketPrice)}</span>
                </div>
              )}
              {proposal.totalPriceDifference != null && (
                <div>
                  <span className="text-slate-500 font-medium">Net Difference: </span>
                  <span className={`font-bold ${parseFloat(proposal.totalPriceDifference) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(proposal.totalPriceDifference)}
                    {parseFloat(proposal.totalPriceDifference) >= 0 ? ' — Savings' : ' — Over Market'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Status Actions ── */}
      {canUpdateStatus && !isFinished && (
        <div className="card p-6">
          <h3 className="text-[0.875rem] font-bold text-slate-800 mb-1">Status Actions</h3>
          <p className="text-[0.75rem] text-slate-500 mb-4">Update the proposal status from Accounts Department.</p>

          {statusMsg && (
            <div className={`mb-4 px-4 py-2.5 rounded-lg text-[0.8125rem] ${
              statusMsg.includes('successfully')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {statusMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {STATUS_ACTIONS.map(action => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={statusUpdating || proposal.status === action.status}
                className={`btn text-white ${action.colorClass} disabled:opacity-40`}
              >
                {statusUpdating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    …
                  </span>
                ) : action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Movement Timeline ── */}
      <div className="card p-6">
        <h3 className="text-[0.875rem] font-bold text-slate-800 mb-5">Movement Timeline</h3>

        {movements.length === 0 ? (
          <p className="text-slate-400 text-sm">No movement records yet.</p>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="timeline-item">
                <div className={`timeline-dot ${movement.current ? 'active' : 'done'}`} />

                <div className={`ml-2 p-4 rounded-xl border ${
                  movement.current
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {movement.fromStage && (
                          <>
                            <span className="text-[0.75rem] text-slate-400">{movement.fromStage.stageName}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                        <span className={`text-[0.875rem] font-bold ${movement.current ? 'text-blue-700' : 'text-slate-700'}`}>
                          {movement.toStage.stageName}
                        </span>
                        {movement.current && (
                          <span className="badge badge-under-review">Current</span>
                        )}
                      </div>
                      {movement.remarks && (
                        <p className="text-[0.75rem] text-slate-500 mt-0.5">{movement.remarks}</p>
                      )}
                      {movement.movedByFullName && (
                        <p className="text-[0.6875rem] text-slate-400 mt-1">
                          By: <span className="font-medium text-slate-600">{movement.movedByFullName}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {movement.current ? (
                        <div>
                          <p className="text-[0.6875rem] text-slate-400">Since {formatDateTime(movement.enteredAt)}</p>
                          <p className="text-[0.875rem] font-bold text-blue-700 mt-0.5 tabular-nums">
                            {Math.floor((Date.now() - new Date(movement.enteredAt)) / 86400000)}d running
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[0.6875rem] text-slate-400">
                            {formatDateTime(movement.enteredAt)} → {formatDateTime(movement.exitedAt)}
                          </p>
                          <p className="text-[0.875rem] font-bold text-slate-700 mt-0.5 tabular-nums">
                            {movement.daysSpent} {movement.daysSpent === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {movements.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[0.8125rem] text-slate-600">
              <span className="font-bold">{movements.length}</span> stage{movements.length > 1 ? 's' : ''} traversed
            </p>
            <div className="text-right">
              <p className="text-[0.6875rem] text-slate-400">Total Processing Time</p>
              <p className="text-[1rem] font-bold text-slate-800 tabular-nums">{totalDays} days</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
