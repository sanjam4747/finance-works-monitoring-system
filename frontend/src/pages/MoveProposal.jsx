import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { proposalAPI, stageAPI } from '../api/services';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function MoveProposal() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isExec  = user?.role === 'EXECUTIVE_USER';

  const [proposals, setProposals]           = useState([]);
  const [stages, setStages]                 = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [movements, setMovements]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');

  const [form, setForm] = useState({
    proposalId: paramId || '',
    toStageId:  '',
    remarks:    '',
  });

  useEffect(() => {
    Promise.all([
      proposalAPI.getAll({}),
      stageAPI.getAll(),
    ]).then(([pRes, sRes]) => {
      setProposals(pRes.data.filter(p => !['COMPLETED', 'REJECTED', 'APPROVED'].includes(p.status)));
      setStages(sRes.data);
    });
  }, []);

  useEffect(() => {
    if (form.proposalId) {
      setLoadingProposal(true);
      Promise.all([
        proposalAPI.getById(form.proposalId),
        proposalAPI.getMovements(form.proposalId),
      ]).then(([pRes, mRes]) => {
        setSelectedProposal(pRes.data);
        setMovements(mRes.data);
      }).finally(() => setLoadingProposal(false));
    } else {
      setSelectedProposal(null);
      setMovements([]);
    }
  }, [form.proposalId]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.proposalId || !form.toStageId) {
      setError('Please select a proposal and target stage');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await proposalAPI.move(form.proposalId, {
        toStageId: Number(form.toStageId),
        remarks:   form.remarks,
      });
      setSuccess(`Proposal moved to ${res.data.currentStage?.stageName} successfully!`);
      setTimeout(() => navigate(`/proposals/${form.proposalId}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move proposal');
    } finally {
      setLoading(false);
    }
  };

  const availableStages = stages.filter(s => {
    if (!selectedProposal) return true;
    if (selectedProposal.currentStage?.id === s.id) return false;
    if (isExec) return s.stageName === 'Accounts Department';
    return true;
  });

  const workflowStages = ['Executive Department', 'Accounts Department', 'Completed'];

  return (
    <div className="w-full max-w-3xl fade-in">
      {/* ── Back + Header ── */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/proposals')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[0.8125rem] mb-3 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Proposals
        </button>
        <h2 className="text-[1rem] font-bold text-slate-800">Move Proposal to Next Stage</h2>
        <p className="text-[0.75rem] text-slate-400 mt-0.5">Record the stage transition and calculate time spent</p>

        {isExec && (
          <div className="mt-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[0.75rem] text-blue-700 font-medium">
            As Executive User, you can only forward proposals to the Accounts Department.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* ── Form ── */}
        <div className="lg:col-span-3 card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Select Proposal <span className="text-red-500">*</span></label>
              <select
                name="proposalId"
                value={form.proposalId}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Choose a proposal…</option>
                {proposals.map(p => (
                  <option key={p.id} value={p.id}>{p.proposalNumber} — {p.proposalTitle}</option>
                ))}
              </select>
            </div>

            {loadingProposal && <LoadingSpinner message="Loading proposal…" />}

            {selectedProposal && !loadingProposal && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[0.6875rem] text-blue-500 font-bold uppercase tracking-wide mb-1">Current Stage</p>
                <p className="font-bold text-blue-800 text-[0.875rem]">
                  {selectedProposal.currentStage?.stageName || 'N/A'}
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedProposal.status} />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Move To <span className="text-red-500">*</span></label>
              <select
                name="toStageId"
                value={form.toStageId}
                onChange={handleChange}
                required
                disabled={!selectedProposal}
                className="form-select disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select target stage…</option>
                {availableStages.map(s => (
                  <option key={s.id} value={s.id}>{s.stageName}</option>
                ))}
              </select>
              {isExec && availableStages.length === 0 && selectedProposal && (
                <p className="text-[0.75rem] text-amber-600 mt-1">
                  This proposal is already in Accounts Department or there are no available stages.
                </p>
              )}
            </div>

            <div>
              <label className="form-label">Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add movement notes or comments…"
                rows={4}
                className="form-textarea resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.8125rem] rounded-xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading || !selectedProposal || availableStages.length === 0}
                className="btn btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Moving…
                  </span>
                ) : 'Move Proposal'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="btn btn-secondary px-5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* ── Journey Panel ── */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-[0.8125rem] font-bold text-slate-700 mb-4">Workflow Journey</h3>

          {/* Stage progress */}
          <div className="mb-4 space-y-2.5">
            {workflowStages.map((stage, i) => {
              const isCurrent = selectedProposal?.currentStage?.stageName === stage;
              const isPast    = movements.some(m => m.toStage?.stageName === stage && m.exitedAt);
              return (
                <div key={stage} className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                    isCurrent ? 'bg-blue-500 ring-4 ring-blue-100' : isPast ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <span className={`text-[0.75rem] font-medium ${
                    isCurrent ? 'text-blue-700' : isPast ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {stage}
                    {isCurrent && <span className="ml-1.5 text-[0.6875rem] font-normal bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">current</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500 mb-2.5">Movement History</p>
            {!selectedProposal ? (
              <p className="text-slate-400 text-[0.75rem]">Select a proposal to see its journey</p>
            ) : movements.length === 0 ? (
              <p className="text-slate-400 text-[0.75rem]">No movements recorded yet</p>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border text-[0.75rem] ${
                      m.current
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <p className={`font-semibold ${m.current ? 'text-blue-700' : 'text-slate-700'}`}>
                      {m.toStage.stageName}
                      {m.current && <span className="ml-1 font-normal opacity-70">(current)</span>}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {m.current
                        ? `Since ${new Date(m.enteredAt).toLocaleDateString('en-IN')} · Running`
                        : `${m.daysSpent} day${m.daysSpent !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
