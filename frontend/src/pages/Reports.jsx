import { useEffect, useState } from 'react';
import { reportAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TABS = [
  { label: 'Aging Report',          icon: '⏱' },
  { label: 'Department Delay',      icon: '📊' },
  { label: 'Dept. Performance',     icon: '🏢' },
  { label: 'Price Analysis',        icon: '💰' },
];

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
      <table className="data-table">
        <thead>
          <tr>
            <th>Proposal No.</th>
            <th>Title</th>
            <th>Department</th>
            <th>Current Stage</th>
            <th>Status</th>
            <th className="text-center">Total Days</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map(p => (
            <tr key={p.id}>
              <td><span className="font-mono font-bold text-blue-700">{p.proposalNumber}</span></td>
              <td className="max-w-[240px]"><span className="truncate block text-slate-700">{p.proposalTitle}</span></td>
              <td className="text-slate-600">{p.department?.name}</td>
              <td className="text-slate-600">{p.currentStage?.stageName || 'N/A'}</td>
              <td><StatusBadge status={p.status} /></td>
              <td className="text-center">
                <span className={`font-bold tabular-nums ${color}`}>{p.totalDaysSpent}d</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tooltipStyle = { fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' };

export default function Reports() {
  const [activeTab, setActiveTab]   = useState(0);
  const [aging, setAging]           = useState(null);
  const [stageDelay, setStageDelay] = useState([]);
  const [deptPerf, setDeptPerf]     = useState([]);
  const [loading, setLoading]       = useState(true);

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

  const priceProposals = aging
    ? [...(aging.over7Days || []), ...(aging.over15Days || []), ...(aging.over30Days || [])]
        .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    : [];
  const proposalsWithPrice = priceProposals.filter(p => p.offeredPrice != null);

  return (
    <div className="space-y-5 fade-in">
      {/* ── Header ── */}
      <div>
        <h2 className="text-[1rem] font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-[0.75rem] text-slate-400 mt-0.5">In-depth analysis of proposal processing performance</p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-0 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm w-full sm:w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`px-3 sm:px-4 py-2.5 text-[0.75rem] sm:text-[0.8125rem] font-medium transition-all duration-150 border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === i
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner message="Loading reports..." /> : (
        <div className="card overflow-hidden">

          {/* ── Tab 0: Aging ── */}
          {activeTab === 0 && aging && (
            <div>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[0.875rem] font-bold text-slate-800">Aging Report</h3>
                <p className="text-[0.75rem] text-slate-500 mt-0.5">Proposals that have been pending for extended periods</p>
              </div>

              {/* Summary chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
                {[
                  { label: 'Over 7 Days',  count: aging.over7Days?.length ?? 0,  textColor: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
                  { label: 'Over 15 Days', count: aging.over15Days?.length ?? 0, textColor: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
                  { label: 'Over 30 Days', count: aging.over30Days?.length ?? 0, textColor: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
                ].map(s => (
                  <div key={s.label} className={`p-4 rounded-xl border ${s.bg} flex items-start gap-3`}>
                    <div>
                      <p className={`text-xl font-bold tabular-nums ${s.textColor}`}>{s.count}</p>
                      <p className="text-[0.6875rem] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {[
                  { data: aging.over30Days, label: '30 days', color: 'text-red-600',    dot: 'bg-red-500' },
                  { data: aging.over15Days, label: '15 days', color: 'text-orange-600', dot: 'bg-orange-500' },
                  { data: aging.over7Days,  label: '7 days',  color: 'text-amber-600',  dot: 'bg-amber-500' },
                ].map(({ data, label, color, dot }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                      <h4 className="font-bold text-slate-700 text-[0.8125rem]">
                        Pending Over {label}
                        <span className="ml-1.5 text-slate-400 font-normal">({data?.length ?? 0})</span>
                      </h4>
                    </div>
                    <AgingTable proposals={data} label={label} color={color} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab 1: Department Delay ── */}
          {activeTab === 1 && (
            <div>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[0.875rem] font-bold text-slate-800">Department Delay Analysis</h3>
                <p className="text-[0.75rem] text-slate-500 mt-0.5">Average time proposals spend in each department stage</p>
              </div>
              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div className="w-full overflow-hidden min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stageDelay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="stageName" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      label={{ value: 'Avg Days', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }}
                    />
                    <Tooltip formatter={(v) => [`${v} days`, 'Average Days']} contentStyle={tooltipStyle} />
                    <Bar dataKey="averageDaysSpent" radius={[6, 6, 0, 0]} name="Avg Days">
                      {stageDelay.map((entry, index) => (
                        <Cell key={index} fill={entry.stageName === 'Executive Department' ? '#3b82f6' : '#06b6d4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stageDelay.map(stage => (
                    <div
                      key={stage.stageId}
                      className="rounded-xl p-5 border"
                      style={{
                        backgroundColor: stage.stageName === 'Executive Department' ? '#eff6ff' : '#ecfeff',
                        borderColor: stage.stageName === 'Executive Department' ? '#bfdbfe' : '#a5f3fc',
                      }}
                    >
                      <p className="text-[0.6875rem] font-bold uppercase tracking-wide mb-1.5" style={{ color: stage.stageName === 'Executive Department' ? '#2563eb' : '#0891b2' }}>
                        {stage.stageName}
                      </p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: stage.stageName === 'Executive Department' ? '#1e40af' : '#164e63' }}>
                        {stage.averageDaysSpent}
                        <span className="text-sm font-normal ml-1 opacity-70">avg days</span>
                      </p>
                      <p className="text-[0.6875rem] text-slate-500 mt-1">{stage.proposalCount} proposals processed</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Department Performance ── */}
          {activeTab === 2 && (
            <div>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[0.875rem] font-bold text-slate-800">Department Performance Report</h3>
                <p className="text-[0.75rem] text-slate-500 mt-0.5">Proposal throughput and processing time by submitting department</p>
              </div>
              <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div className="w-full overflow-hidden min-w-0">
                  <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptPerf} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
                    <Tooltip
                      formatter={(v, name) => [v, name === 'averageProcessingDays' ? 'Avg Days' : name === 'totalProposals' ? 'Total' : 'Completed']}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="averageProcessingDays" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Avg Days" />
                  </BarChart>
                </ResponsiveContainer>
                </div>

                <div className="table-scroll-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Completed</th>
                        <th className="text-center">Completion Rate</th>
                        <th className="text-center">Avg. Processing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptPerf.map(d => (
                        <tr key={d.departmentId}>
                          <td className="font-semibold text-slate-800">{d.departmentName}</td>
                          <td className="text-center tabular-nums">{d.totalProposals}</td>
                          <td className="text-center text-emerald-600 font-semibold tabular-nums">{d.completedProposals}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${d.totalProposals > 0 ? (d.completedProposals / d.totalProposals * 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-[0.75rem] text-slate-600 tabular-nums w-8">
                                {d.totalProposals > 0 ? Math.round(d.completedProposals / d.totalProposals * 100) : 0}%
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`font-bold tabular-nums ${d.averageProcessingDays > 20 ? 'text-red-600' : d.averageProcessingDays > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {d.averageProcessingDays}d
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

          {/* ── Tab 3: Price Analysis ── */}
          {activeTab === 3 && (
            <div>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[0.875rem] font-bold text-slate-800">Price Analysis — Offered vs. Market Price</h3>
                <p className="text-[0.75rem] text-slate-500 mt-0.5">Comparison of offered price against market price for proposals with pricing data</p>
              </div>
              <div className="p-6">
                {proposalsWithPrice.length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-sm">No pricing data available for aging proposals</p>
                    <p className="text-[0.75rem] mt-1">Price analysis is shown only for proposals with pricing information</p>
                  </div>
                ) : (
                  <div className="table-scroll-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Proposal No.</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th className="text-center">Offered Price</th>
                          <th className="text-center">Market Price</th>
                          <th className="text-center">Difference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposalsWithPrice.map(p => {
                          const diff = p.priceDifference != null ? parseFloat(p.priceDifference) : null;
                          return (
                            <tr key={p.id}>
                              <td><span className="font-mono font-bold text-blue-700">{p.proposalNumber}</span></td>
                              <td className="text-slate-700">{p.productName || '—'}</td>
                              <td className="text-slate-600 tabular-nums">{p.productQuantity?.toLocaleString('en-IN') || '—'}</td>
                              <td className="text-center font-semibold text-slate-700 tabular-nums">{formatCurrency(p.offeredPrice)}</td>
                              <td className="text-center text-slate-600 tabular-nums">{formatCurrency(p.marketPrice)}</td>
                              <td className="text-center tabular-nums">
                                {diff != null ? (
                                  <span className={`font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td><StatusBadge status={p.status} /></td>
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
