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

  const [proposals, setProposals] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    proposalId: paramId || '',
    toStageId: '',
    remarks: '',
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
        remarks: form.remarks,
      });
      setSuccess(`Proposal moved to ${res.data.currentStage?.stageName} successfully!`);
      setTimeout(() => navigate(`/proposals/${form.proposalId}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move proposal');
    } finally {
      setLoading(false);
    }
  };

  // For Executive User: only show "Accounts Department" as target
  // For Admin: exclude current stage
  const availableStages = stages.filter(s => {
    if (!selectedProposal) return true;
    if (selectedProposal.currentStage?.id === s.id) return false; // can't move to current
    if (isExec) return s.stageName === 'Accounts Department'; // exec can only move to Accounts
    return true; // admin sees all others
  });

  return (
    <div className="max-w-3xl fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate('/proposals')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Proposals
        </button>
        <h2 className="text-xl font-bold text-slate-800">Move Proposal to Next Stage</h2>
        <p className="text-slate-500 text-sm mt-0.5">Record the stage transition and calculate time spent</p>

        {/* Role hint for Executive User */}
        {isExec && (
          <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
            As Executive User, you can only forward proposals to the Accounts Department.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Proposal <span className="text-red-500">*</span>
              </label>
              <select
                name="proposalId"
                value={form.proposalId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a proposal...</option>
                {proposals.map(p => (
                  <option key={p.id} value={p.id}>{p.proposalNumber} — {p.proposalTitle}</option>
                ))}
              </select>
            </div>

            {loadingProposal && <LoadingSpinner message="Loading proposal..." />}

            {selectedProposal && !loadingProposal && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Current Stage</p>
                <p className="font-bold text-blue-800">
                  {selectedProposal.currentStage?.stageName || 'N/A'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedProposal.status} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Move To <span className="text-red-500">*</span>
              </label>
              <select
                name="toStageId"
                value={form.toStageId}
                onChange={handleChange}
                required
                disabled={!selectedProposal}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select target stage...</option>
                {availableStages.map(s => (
                  <option key={s.id} value={s.id}>{s.stageName}</option>
                ))}
              </select>
              {isExec && availableStages.length === 0 && selectedProposal && (
                <p className="text-xs text-amber-600 mt-1">
                  This proposal is already in Accounts Department or there are no available stages.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add movement notes or comments..."
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !selectedProposal || availableStages.length === 0}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Moving...
                  </span>
                ) : 'Move Proposal'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Current Journey */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Workflow Journey</h3>

          {/* Workflow diagram */}
          <div className="mb-4 space-y-2">
            {['Executive Department', 'Accounts Department', 'Completed'].map((stage, i) => {
              const isCurrent = selectedProposal?.currentStage?.stageName === stage;
              const isPast = movements.some(m => m.toStage?.stageName === stage && m.exitedAt);
              return (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isCurrent ? 'bg-blue-500' : isPast ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isCurrent ? 'text-blue-700' : isPast ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {stage} {isCurrent && '← current'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">Movement History</p>
            {!selectedProposal ? (
              <p className="text-slate-400 text-xs">Select a proposal to see its journey</p>
            ) : movements.length === 0 ? (
              <p className="text-slate-400 text-xs">No movements recorded yet</p>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border text-xs ${
                      m.current
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <p className={`font-semibold ${m.current ? 'text-blue-700' : 'text-slate-700'}`}>
                      {m.toStage.stageName}
                      {m.current && <span className="ml-1 font-normal">(current)</span>}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {m.current
                        ? `Since ${new Date(m.enteredAt).toLocaleDateString('en-IN')} · Running`
                        : `${m.daysSpent} days`
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
