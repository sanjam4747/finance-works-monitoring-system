import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalAPI, departmentAPI } from '../api/services';

export default function CreateProposal() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    proposalTitle: '',
    departmentId: '',
    remarks: '',
    productName: '',
    productQuantity: '',
    offeredPrice: '',
    marketPrice: '',
  });

  useEffect(() => {
    departmentAPI.getAll().then((res) => setDepartments(res.data));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Computed price difference preview
  const priceDiff = (() => {
    const offered = parseFloat(form.offeredPrice);
    const market = parseFloat(form.marketPrice);
    if (!isNaN(offered) && !isNaN(market) && form.marketPrice) {
      return (market - offered).toFixed(2);
    }
    return null;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        proposalTitle: form.proposalTitle,
        departmentId: Number(form.departmentId),
        remarks: form.remarks || null,
        productName: form.productName || null,
        productQuantity: form.productQuantity ? Number(form.productQuantity) : null,
        offeredPrice: form.offeredPrice ? Number(form.offeredPrice) : null,
        marketPrice: form.marketPrice ? Number(form.marketPrice) : null,
      };
      const res = await proposalAPI.create(payload);
      setSuccess(`Proposal ${res.data.proposalNumber} created successfully! Auto-assigned to Executive Department.`);
      setTimeout(() => navigate(`/proposals/${res.data.id}`), 1800);
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

      {/* Auto-set notice */}
      <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-medium">Automatically assigned by system:</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Proposal Number (FW-{new Date().getFullYear()}-XXX) · Initial Stage: Executive Department · Status: Pending · Date: Today
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
              Proposal Information
            </h3>
            <div className="space-y-4">
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
                  Submitting Department <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Add any initial remarks or notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
              Product Details <span className="text-xs font-normal text-slate-400">(optional)</span>
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    placeholder="e.g. Steel Rails"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    name="productQuantity"
                    value={form.productQuantity}
                    onChange={handleChange}
                    placeholder="e.g. 100"
                    min="1"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Offered Price (₹)
                  </label>
                  <input
                    type="number"
                    name="offeredPrice"
                    value={form.offeredPrice}
                    onChange={handleChange}
                    placeholder="e.g. 500000"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Market Price (₹) <span className="text-xs text-slate-400">optional</span>
                  </label>
                  <input
                    type="number"
                    name="marketPrice"
                    value={form.marketPrice}
                    onChange={handleChange}
                    placeholder="e.g. 550000"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Live price difference preview */}
              {priceDiff !== null && (
                <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                  parseFloat(priceDiff) >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Price Difference (Market − Offered): ₹{parseFloat(priceDiff).toLocaleString('en-IN')}
                  {parseFloat(priceDiff) >= 0 ? ' (Savings)' : ' (Over Market)'}
                </div>
              )}
            </div>
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
