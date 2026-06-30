import { useEffect, useState } from 'react';
import { reportAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TABS = ['Aging', 'Department Delay', 'Department Performance', 'Price Analysis'];

function formatCurrency(val) {
  if (val == null) return '—';
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function AgingTable({ proposals, label, color }) {
  if (!proposals?.length) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        No proposals pending over {label}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Proposal No.</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Department</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Current Stage</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Days</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {proposals.map(p => (
            <tr key={p.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <span className="font-mono font-semibold text-blue-700">{p.proposalNumber}</span>
              </td>
              <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{p.proposalTitle}</td>
              <td className="px-4 py-3 text-slate-600">{p.department?.name}</td>
              <td className="px-4 py-3 text-slate-600">{p.currentStage?.stageName || 'N/A'}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              <td className="px-4 py-3">
                <span className={`font-bold ${color}`}>{p.totalDaysSpent} days</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [aging, setAging] = useState(null);
  const [stageDelay, setStageDelay] = useState([]);
  const [deptPerf, setDeptPerf] = useState([]);
  const [allProposals, setAllProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.getAging(),
      reportAPI.getStageDelay(),
      reportAPI.getDepartmentPerformance(),
    ]).then(([agingRes, stageRes, deptRes]) => {
      setAging(agingRes.data);
      setStageDelay(stageRes.data);
      setDeptPerf(deptRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // Gather proposals with price data from aging report
  const priceProposals = aging
    ? [...(aging.over7Days || []), ...(aging.over15Days || []), ...(aging.over30Days || [])]
        .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i) // unique
    : [];

  const proposalsWithPrice = priceProposals.filter(p => p.offeredPrice != null);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-slate-500 text-sm mt-0.5">In-depth analysis of proposal processing performance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === i
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner message="Loading reports..." /> : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Tab 0: Aging Report */}
          {activeTab === 0 && aging && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Aging Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">Proposals that have been pending for extended periods</p>
              </div>
              <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-slate-100">
                {[
                  { label: 'Over 7 Days',  count: aging.over7Days?.length ?? 0,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
                  { label: 'Over 15 Days', count: aging.over15Days?.length ?? 0, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                  { label: 'Over 30 Days', count: aging.over30Days?.length ?? 0, color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
                ].map(s => (
                  <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-8">
                {[
                  { data: aging.over30Days, label: '30 days', color: 'text-red-600',    dot: 'bg-red-500' },
                  { data: aging.over15Days, label: '15 days', color: 'text-orange-600', dot: 'bg-orange-500' },
                  { data: aging.over7Days,  label: '7 days',  color: 'text-amber-600',  dot: 'bg-amber-500' },
                ].map(({ data, label, color, dot }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-3 h-3 rounded-full ${dot}`}></span>
                      <h4 className="font-bold text-slate-700 text-sm">Pending Over {label} ({data?.length ?? 0})</h4>
                    </div>
                    <AgingTable proposals={data} label={label} color={color} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 1: Department Delay */}
          {activeTab === 1 && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Department Delay Analysis</h3>
                <p className="text-sm text-slate-500 mt-0.5">Average time proposals spend in each department stage</p>
              </div>
              <div className="p-6 space-y-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stageDelay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="stageName" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Avg Days', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }} />
                    <Tooltip formatter={(v) => [`${v} days`, 'Average Days']} />
                    <Bar dataKey="averageDaysSpent" radius={[6, 6, 0, 0]} name="Avg Days">
                      {stageDelay.map((entry, index) => (
                        <Cell key={index} fill={entry.stageName === 'Executive Department' ? '#3b82f6' : '#06b6d4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-4">
                  {stageDelay.map(stage => (
                    <div
                      key={stage.stageId}
                      className="rounded-xl p-5 border"
                      style={{
                        backgroundColor: stage.stageName === 'Executive Department' ? '#eff6ff' : '#ecfeff',
                        borderColor: stage.stageName === 'Executive Department' ? '#bfdbfe' : '#a5f3fc',
                      }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: stage.stageName === 'Executive Department' ? '#2563eb' : '#0891b2' }}>
                        {stage.stageName}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: stage.stageName === 'Executive Department' ? '#1e40af' : '#164e63' }}>
                        {stage.averageDaysSpent}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">avg days · {stage.proposalCount} proposals</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Department Performance */}
          {activeTab === 2 && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Department Performance Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">Proposal throughput and processing time by submitting department</p>
              </div>
              <div className="p-6 space-y-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={deptPerf} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
                    <Tooltip formatter={(v, name) => [v, name === 'averageProcessingDays' ? 'Avg Days' : name === 'totalProposals' ? 'Total' : 'Completed']} />
                    <Bar dataKey="averageProcessingDays" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Avg Days" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Department</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Completed</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Completion Rate</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Avg Processing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deptPerf.map(d => (
                        <tr key={d.departmentId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-semibold text-slate-700">{d.departmentName}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{d.totalProposals}</td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-medium">{d.completedProposals}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex-1 max-w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${d.totalProposals > 0 ? (d.completedProposals / d.totalProposals * 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">
                                {d.totalProposals > 0 ? Math.round(d.completedProposals / d.totalProposals * 100) : 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${d.averageProcessingDays > 20 ? 'text-red-600' : d.averageProcessingDays > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {d.averageProcessingDays} days
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Price Analysis */}
          {activeTab === 3 && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Price Analysis — Offered vs. Market Price</h3>
                <p className="text-sm text-slate-500 mt-0.5">Comparison of offered price against market price for proposals with pricing data</p>
              </div>
              <div className="p-6">
                {proposalsWithPrice.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No pricing data available for aging proposals</p>
                    <p className="text-sm mt-1">Price analysis is shown only for proposals with pricing information</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Proposal No.</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Product</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Qty</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Offered Price</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Market Price</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Difference</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {proposalsWithPrice.map(p => {
                          const diff = p.priceDifference != null ? parseFloat(p.priceDifference) : null;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3">
                                <span className="font-mono font-semibold text-blue-700">{p.proposalNumber}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{p.productName || '—'}</td>
                              <td className="px-4 py-3 text-slate-600">{p.productQuantity?.toLocaleString('en-IN') || '—'}</td>
                              <td className="px-4 py-3 text-center font-medium text-slate-700">{formatCurrency(p.offeredPrice)}</td>
                              <td className="px-4 py-3 text-center text-slate-600">{formatCurrency(p.marketPrice)}</td>
                              <td className="px-4 py-3 text-center">
                                {diff != null ? (
                                  <span className={`font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                  </span>
                                ) : <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
