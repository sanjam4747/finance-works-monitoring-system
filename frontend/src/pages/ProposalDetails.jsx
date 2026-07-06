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
  const [auditLogs, setAuditLogs]         = useState([]);
  const [comments, setComments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMsg, setStatusMsg]         = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [newComment, setNewComment]       = useState('');
  const [commenting, setCommenting]       = useState(false);

  const isAdmin    = user?.role === 'ADMIN';
  const isAccounts = user?.role === 'ACCOUNTS_USER';
  const canUpdateStatus = isAdmin || isAccounts;
  const canMove    = isAdmin || user?.role === 'EXECUTIVE_USER';

  useEffect(() => {
    Promise.all([
      proposalAPI.getById(id),
      proposalAPI.getMovements(id),
      proposalAPI.getAuditLogs(id),
      proposalAPI.getComments(id)
    ]).then(([propRes, movRes, auditRes, comRes]) => {
      setProposal(propRes.data);
      setMovements(movRes.data);
      setAuditLogs(auditRes.data);
      setComments(comRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (status) => {
    if (status === 'RETURNED' && !showReturnInput) {
      setShowReturnInput(true);
      return;
    }
    if (status === 'RETURNED' && !returnRemarks.trim()) {
      setStatusMsg('Remarks are required to return a proposal.');
      return;
    }

    setStatusUpdating(true);
    setStatusMsg('');
    try {
      const res = await proposalAPI.updateStatus(id, status, returnRemarks);
      setProposal(res.data);
      setStatusMsg(`Status updated to ${status.replace('_', ' ')} successfully.`);
      setShowReturnInput(false);
      setReturnRemarks('');
      
      // Refresh audit logs
      const auditRes = await proposalAPI.getAuditLogs(id);
      setAuditLogs(auditRes.data);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };
  
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await proposalAPI.addComment(id, newComment);
      setComments([res.data, ...comments]);
      setNewComment('');
      
      const auditRes = await proposalAPI.getAuditLogs(id);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading proposal details…" />;
  if (!proposal) return <div className="text-center py-20 text-slate-500">Proposal not found.</div>;

  const totalDays = movements.reduce((acc, m) => acc + (m.daysSpent || 0), 0);
  const isFinished = ['COMPLETED', 'APPROVED', 'REJECTED'].includes(proposal.status);
  
  const latestReturnLog = auditLogs.find(a => a.action === 'RETURN');
  
  const timelineEvents = [
    ...movements.map(m => ({ ...m, type: 'movement', sortTime: new Date(m.enteredAt).getTime() })),
    ...auditLogs
       .filter(a => !['FORWARD', 'UPDATE'].includes(a.action))
       .map(a => ({ ...a, type: 'audit', sortTime: new Date(a.timestamp).getTime() }))
  ].sort((a, b) => a.sortTime - b.sortTime);

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
      
      {proposal.status === 'RETURNED' && latestReturnLog && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex gap-4">
          <div className="mt-1 bg-amber-100 text-amber-600 rounded-full p-1.5 flex-shrink-0 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-[0.875rem] font-bold text-amber-900 mb-1">Proposal Returned</h4>
            <p className="text-[0.8125rem] text-amber-800 leading-relaxed">{latestReturnLog.remarks}</p>
            <p className="text-[0.75rem] text-amber-700 mt-2 font-medium">
              By {latestReturnLog.actorFullName} ({latestReturnLog.departmentName}) on {formatDateTime(latestReturnLog.timestamp)}
            </p>
          </div>
        </div>
      )}

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
                disabled={statusUpdating || proposal.status === action.status || (action.status === 'RETURNED' && showReturnInput && !returnRemarks.trim())}
                className={`btn text-white ${action.colorClass} disabled:opacity-40`}
              >
                {statusUpdating && action.status === 'RETURNED' && returnRemarks ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    …
                  </span>
                ) : action.label}
              </button>
            ))}
          </div>
          
          {showReturnInput && (
            <div className="mt-4 animate-in slide-in-from-top-2 fade-in">
              <label className="form-label text-red-600">Return Remarks (Required)</label>
              <textarea
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                placeholder="Please state the reason for returning this proposal..."
                className="form-input min-h-[80px]"
              />
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-[0.875rem] font-bold text-slate-800 mb-5">Audit & Movement Timeline</h3>

        {timelineEvents.length === 0 ? (
          <p className="text-slate-400 text-sm">No records yet.</p>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              if (event.type === 'audit') {
                return (
                  <div key={`audit-${event.id}`} className="timeline-item">
                    <div className="timeline-dot active bg-indigo-500 border-indigo-200" />
                    <div className="ml-2 p-4 rounded-xl border bg-indigo-50 border-indigo-100">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="badge bg-indigo-100 text-indigo-700 border-indigo-200">
                              {event.action}
                            </span>
                          </div>
                          {event.remarks && (
                            <p className="text-[0.8125rem] text-indigo-900 mt-1.5">{event.remarks}</p>
                          )}
                          <p className="text-[0.6875rem] text-indigo-500 mt-2">
                            By: <span className="font-semibold text-indigo-700">{event.actorFullName || 'System'}</span> 
                            {event.departmentName && ` (${event.departmentName})`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[0.6875rem] text-indigo-500">{formatDateTime(event.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
              <div key={`movement-${event.id}`} className="timeline-item">
                <div className={`timeline-dot ${event.current ? 'active' : 'done'}`} />

                <div className={`ml-2 p-4 rounded-xl border ${
                  event.current
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {event.fromStage && (
                          <>
                            <span className="text-[0.75rem] text-slate-400">{event.fromStage.stageName}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                        <span className={`text-[0.875rem] font-bold ${event.current ? 'text-blue-700' : 'text-slate-700'}`}>
                          {event.toStage.stageName}
                        </span>
                        {event.current && (
                          <span className="badge badge-under-review">Current</span>
                        )}
                      </div>
                      {event.remarks && (
                        <p className="text-[0.75rem] text-slate-500 mt-0.5">{event.remarks}</p>
                      )}
                      {event.movedByFullName && (
                        <p className="text-[0.6875rem] text-slate-400 mt-1">
                          By: <span className="font-medium text-slate-600">{event.movedByFullName}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {event.current ? (
                        <div>
                          <p className="text-[0.6875rem] text-slate-400">Since {formatDateTime(event.enteredAt)}</p>
                          <p className="text-[0.875rem] font-bold text-blue-700 mt-0.5 tabular-nums">
                            {Math.floor((Date.now() - new Date(event.enteredAt)) / 86400000)}d running
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[0.6875rem] text-slate-400">
                            {formatDateTime(event.enteredAt)} → {formatDateTime(event.exitedAt)}
                          </p>
                          <p className="text-[0.875rem] font-bold text-slate-700 mt-0.5 tabular-nums">
                            {event.daysSpent} {event.daysSpent === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
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
      
      {/* ── Comments / Discussion ── */}
      <div className="card p-6">
        <h3 className="text-[0.875rem] font-bold text-slate-800 mb-5">Discussion & Comments</h3>
        
        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="form-input min-h-[80px] mb-3"
            required
          />
          <div className="text-right">
            <button 
              type="submit" 
              disabled={commenting || !newComment.trim()} 
              className="btn btn-primary"
            >
              {commenting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
        
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No comments yet. Start the discussion!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
                  {c.fullName ? c.fullName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-1">
                  <div className="flex justify-between items-start mb-1 gap-2 flex-wrap">
                    <div>
                      <span className="font-bold text-[0.8125rem] text-slate-800">{c.fullName}</span>
                      {c.departmentName && (
                        <span className="ml-2 text-[0.6875rem] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          {c.departmentName}
                        </span>
                      )}
                    </div>
                    <span className="text-[0.6875rem] text-slate-400">{formatDateTime(c.timestamp)}</span>
                  </div>
                  <p className="text-[0.8125rem] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {c.commentText}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
