import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { proposalAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

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

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      proposalAPI.getById(id),
      proposalAPI.getMovements(id),
    ]).then(([propRes, movRes]) => {
      setProposal(propRes.data);
      setMovements(movRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading proposal details..." />;
  if (!proposal) return <div className="text-center py-20 text-slate-500">Proposal not found.</div>;

  const totalDays = movements.reduce((acc, m) => acc + (m.daysSpent || 0), 0);

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
        <div className="flex gap-3">
          <Link
            to={`/proposals/${id}/move`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Move Proposal
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Department', value: proposal.department?.name },
          { label: 'Current Stage', value: proposal.currentStage?.stageName || 'N/A' },
          { label: 'Submission Date', value: formatDate(proposal.submissionDate) },
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

      {/* Movement Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-6">Movement Timeline</h3>

        {movements.length === 0 ? (
          <p className="text-slate-400 text-sm">No movement records yet.</p>
        ) : (
          <div className="space-y-4">
            {movements.map((movement, index) => (
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

        {/* Summary */}
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
