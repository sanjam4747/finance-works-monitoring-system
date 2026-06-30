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
  { label: 'Approve',  status: 'APPROVED',    color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Complete', status: 'COMPLETED',   color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Return',   status: 'RETURNED',    color: 'bg-amber-500 hover:bg-amber-600' },
  { label: 'Reject',   status: 'REJECTED',    color: 'bg-red-600 hover:bg-red-700' },
];

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proposal, setProposal] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const isAdmin    = user?.role === 'ADMIN';
  const isAccounts = user?.role === 'ACCOUNTS_USER';
  const canUpdateStatus = isAdmin || isAccounts;
  const canMove = isAdmin || user?.role === 'EXECUTIVE_USER';

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

  if (loading) return <LoadingSpinner message="Loading proposal details..." />;
  if (!proposal) return <div className="text-center py-20 text-slate-500">Proposal not found.</div>;

  const totalDays = movements.reduce((acc, m) => acc + (m.daysSpent || 0), 0);
  const activeStatuses = ['COMPLETED', 'APPROVED', 'REJECTED'];
  const isFinished = activeStatuses.includes(proposal.status);

  return (
    <div className="space-y-6 max-w-5xl fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Proposals
          </button>
          <h2 className="text-xl font-bold text-slate-800">{proposal.proposalTitle}</h2>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{proposal.proposalNumber}</p>
        </div>
        {canMove && !isFinished && (
          <Link
            to={`/proposals/${id}/move`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Move Proposal
          </Link>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Submitting Dept.', value: proposal.department?.name },
          { label: 'Current Stage',    value: proposal.currentStage?.stageName || 'N/A' },
          { label: 'Submission Date',  value: formatDate(proposal.submissionDate) },
          { label: 'Total Days Elapsed', value: `${totalDays} days` },
        ].map(info => (
          <div key={info.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-1">{info.label}</p>
            <p className="text-sm font-semibold text-slate-800">{info.value}</p>
          </div>
        ))}
      </div>

      {/* Proposal Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-4">Proposal Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <StatusBadge status={proposal.status} />
          </div>
          {proposal.completionDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Completion Date</p>
              <p className="text-slate-700">{formatDate(proposal.completionDate)}</p>
            </div>
          )}
          {proposal.remarks && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Remarks</p>
              <p className="text-slate-700">{proposal.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      {(proposal.productName || proposal.offeredPrice || proposal.marketPrice) && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-4">Product Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {proposal.productName && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Product Name</p>
                <p className="font-semibold text-slate-800">{proposal.productName}</p>
              </div>
            )}
            {proposal.productQuantity && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Quantity</p>
                <p className="font-semibold text-slate-800">{proposal.productQuantity.toLocaleString('en-IN')}</p>
              </div>
            )}
            {proposal.offeredPrice && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Offered Price</p>
                <p className="font-semibold text-blue-700">{formatCurrency(proposal.offeredPrice)}</p>
              </div>
            )}
            {proposal.marketPrice && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Market Price</p>
                <p className="font-semibold text-slate-800">{formatCurrency(proposal.marketPrice)}</p>
              </div>
            )}
            {proposal.priceDifference != null && (
              <div className="col-span-2 md:col-span-4">
                <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                  parseFloat(proposal.priceDifference) >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price Difference (Market − Offered): {formatCurrency(proposal.priceDifference)}
                  {parseFloat(proposal.priceDifference) >= 0 ? ' — Market price is higher' : ' — Offered price exceeds market'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Actions for Accounts User / Admin */}
      {canUpdateStatus && !isFinished && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-2">Status Actions</h3>
          <p className="text-sm text-slate-500 mb-4">Update the proposal status from Accounts Department.</p>
          {statusMsg && (
            <div className={`mb-3 px-4 py-2 rounded-lg text-sm ${
              statusMsg.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>{statusMsg}</div>
          )}
          <div className="flex flex-wrap gap-3">
            {STATUS_ACTIONS.map(action => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={statusUpdating || proposal.status === action.status}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${action.color}`}
              >
                {statusUpdating ? '...' : action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Movement Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-6">Movement Timeline</h3>

        {movements.length === 0 ? (
          <p className="text-slate-400 text-sm">No movement records yet.</p>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="timeline-item">
                <div className={`timeline-dot ${movement.current ? 'active' : 'done'}`}></div>

                <div className={`ml-2 p-4 rounded-xl border ${
                  movement.current
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {movement.fromStage && (
                          <>
                            <span className="text-xs text-slate-500">{movement.fromStage.stageName}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                        <span className={`text-sm font-bold ${movement.current ? 'text-blue-700' : 'text-slate-700'}`}>
                          {movement.toStage.stageName}
                        </span>
                        {movement.current && (
                          <span className="badge badge-under-review">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{movement.remarks}</p>
                    </div>

                    <div className="text-right">
                      {movement.current ? (
                        <div>
                          <p className="text-xs text-slate-500">Since {formatDateTime(movement.enteredAt)}</p>
                          <p className="text-sm font-bold text-blue-700 mt-0.5">
                            {Math.floor((Date.now() - new Date(movement.enteredAt)) / 86400000)} days (running)
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(movement.enteredAt)} → {formatDateTime(movement.exitedAt)}
                          </p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">
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
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{movements.length}</span> stage{movements.length > 1 ? 's' : ''} traversed
            </p>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Processing Time</p>
              <p className="text-lg font-bold text-slate-800">{totalDays} days</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
