import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalAPI, departmentAPI } from '../api/services';

const EMPTY_ITEM = () => ({
  _key:         Date.now() + Math.random(),
  itemName:     '',
  quantity:     1,
  unit:         '',
  offeredPrice: '',
  marketPrice:  '',
  itemRemarks:  '',
});

function formatINR(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreateProposal() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [form, setForm] = useState({
    proposalTitle: '',
    departmentId:  '',
    remarks:       '',
  });

  const [items, setItems] = useState([EMPTY_ITEM()]);

  useEffect(() => {
    departmentAPI.getAll().then((res) => setDepartments(res.data));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Item Table Handlers ──────────────────────────────────────────────────

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(item =>
      item._key === key ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => setItems(prev => [...prev, EMPTY_ITEM()]);

  const removeItem = (key) => {
    if (items.length === 1) return;   // keep at least one row
    setItems(prev => prev.filter(item => item._key !== key));
  };

  // Computed totals
  const totals = items.reduce((acc, item) => {
    const qty      = parseFloat(item.quantity) || 0;
    const offered  = parseFloat(item.offeredPrice) || 0;
    const market   = parseFloat(item.marketPrice) || 0;
    acc.offered   += offered * qty;
    if (item.marketPrice) acc.market += market * qty;
    return acc;
  }, { offered: 0, market: 0 });

  const hasAnyItem = items.some(i => i.itemName.trim() !== '');

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const validItems = items
        .filter(i => i.itemName.trim() !== '')
        .map((i, idx) => ({
          itemName:     i.itemName.trim(),
          quantity:     parseInt(i.quantity) || 1,
          unit:         i.unit || null,
          offeredPrice: i.offeredPrice ? parseFloat(i.offeredPrice) : null,
          marketPrice:  i.marketPrice  ? parseFloat(i.marketPrice)  : null,
          itemRemarks:  i.itemRemarks  || null,
        }));

      const payload = {
        proposalTitle: form.proposalTitle,
        departmentId:  Number(form.departmentId),
        remarks:       form.remarks || null,
        items:         validItems,
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
    <div className="max-w-4xl fade-in">

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
        <h2 className="text-[1rem] font-bold text-slate-800">Create New Proposal</h2>
        <p className="text-[0.75rem] text-slate-400 mt-0.5">Submit a new finance proposal for tracking</p>
      </div>

      {/* ── Auto-set Notice ── */}
      <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-[0.8125rem] flex items-start gap-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-semibold">Automatically assigned by system</p>
          <p className="text-[0.6875rem] text-blue-500 mt-0.5">
            Proposal Number (FW-{new Date().getFullYear()}-XXX) · Stage: Executive Department · Status: Pending · Date: Today
          </p>
        </div>
      </div>

      <div className="card p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* ── Proposal Information ── */}
          <div>
            <h3 className="section-header">Proposal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Proposal Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="proposalTitle"
                  value={form.proposalTitle}
                  onChange={handleChange}
                  placeholder="Enter the full proposal title"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Submitting Department <span className="text-red-500">*</span></label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Remarks</label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Add any initial remarks or notes…"
                  rows={3}
                  className="form-textarea resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Items / Products ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-header mb-0">
                Items / Products
                <span className="ml-2 normal-case font-normal tracking-normal text-slate-400 text-xs">(optional)</span>
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item._key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[0.75rem] font-bold text-slate-500 uppercase tracking-wide">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                    {/* Item Name — spans 3 cols */}
                    <div className="sm:col-span-3">
                      <label className="form-label">Item Name</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={e => updateItem(item._key, 'itemName', e.target.value)}
                        placeholder="e.g. Steel Rails"
                        className="form-input"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label className="form-label">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item._key, 'quantity', e.target.value)}
                        min="1"
                        className="form-input"
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-2">
                      <label className="form-label">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => updateItem(item._key, 'unit', e.target.value)}
                        placeholder="pcs / kg / m"
                        className="form-input"
                      />
                    </div>

                    {/* Offered Price */}
                    <div className="sm:col-span-3">
                      <label className="form-label">Offered Price (₹)</label>
                      <input
                        type="number"
                        value={item.offeredPrice}
                        onChange={e => updateItem(item._key, 'offeredPrice', e.target.value)}
                        placeholder="e.g. 500000"
                        min="0"
                        step="0.01"
                        className="form-input"
                      />
                    </div>

                    {/* Market Price */}
                    <div className="sm:col-span-3">
                      <label className="form-label">Market Price (₹) <span className="font-normal text-slate-400">(optional)</span></label>
                      <input
                        type="number"
                        value={item.marketPrice}
                        onChange={e => updateItem(item._key, 'marketPrice', e.target.value)}
                        placeholder="e.g. 550000"
                        min="0"
                        step="0.01"
                        className="form-input"
                      />
                    </div>

                    {/* Per-item savings indicator */}
                    {item.offeredPrice && item.marketPrice && (() => {
                      const diff = (parseFloat(item.marketPrice) - parseFloat(item.offeredPrice)) * (parseFloat(item.quantity) || 1);
                      if (isNaN(diff)) return null;
                      const positive = diff >= 0;
                      return (
                        <div className={`sm:col-span-6 px-3 py-2 rounded-lg text-[0.75rem] font-medium ${
                          positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {positive ? '✓ Savings' : '⚠ Over market'}: ₹{Math.abs(diff).toLocaleString('en-IN', { maximumFractionDigits: 2 })} on this item
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals row */}
            {hasAnyItem && (
              <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap gap-4 text-[0.8125rem]">
                <div>
                  <span className="font-semibold text-blue-700">Total Offered:</span>{' '}
                  <span className="text-blue-900 font-bold">{formatINR(totals.offered) || '—'}</span>
                </div>
                {totals.market > 0 && (
                  <>
                    <div>
                      <span className="font-semibold text-blue-700">Total Market:</span>{' '}
                      <span className="text-blue-900 font-bold">{formatINR(totals.market)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-700">Overall Diff:</span>{' '}
                      <span className={`font-bold ${totals.market - totals.offered >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatINR(totals.market - totals.offered)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Feedback Messages ── */}
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

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : 'Create Proposal'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/proposals')}
              className="btn btn-secondary px-6"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
