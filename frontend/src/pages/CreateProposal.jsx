import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalAPI, departmentAPI, stageAPI } from '../api/services';

export default function CreateProposal() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    proposalNumber: '',
    proposalTitle: '',
    departmentId: '',
    initialStageId: '',
    remarks: '',
  });

  useEffect(() => {
    Promise.all([departmentAPI.getAll(), stageAPI.getAll()])
      .then(([dRes, sRes]) => {
        setDepartments(dRes.data);
        setStages(sRes.data);
      });
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await proposalAPI.create({
        ...form,
        departmentId: Number(form.departmentId),
        initialStageId: Number(form.initialStageId),
      });
      setSuccess(`Proposal ${res.data.proposalNumber} created successfully!`);
      setTimeout(() => navigate(`/proposals/${res.data.id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl fade-in">
      {/* Header */}
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
        <h2 className="text-xl font-bold text-slate-800">Create New Proposal</h2>
        <p className="text-slate-500 text-sm mt-0.5">Submit a new finance proposal for tracking</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Proposal Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="proposalNumber"
                value={form.proposalNumber}
                onChange={handleChange}
                placeholder="e.g. FW-0051"
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Proposal Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="proposalTitle"
              value={form.proposalTitle}
              onChange={handleChange}
              placeholder="Enter the full proposal title"
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Initial Stage <span className="text-red-500">*</span>
            </label>
            <select
              name="initialStageId"
              value={form.initialStageId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Initial Stage</option>
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.stageName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Add any initial remarks or notes..."
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
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating...
                </span>
              ) : 'Create Proposal'}
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
    </div>
  );
}
