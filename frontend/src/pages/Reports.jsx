import { useEffect, useState } from 'react';
import { reportAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = ['Aging', 'Stage Delay', 'Department Performance'];

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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-slate-500 text-sm mt-0.5">In-depth analysis of proposal processing performance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
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
          {/* Aging Report */}
          {activeTab === 0 && aging && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Aging Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">Proposals that have been pending for extended periods</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-slate-100">
                {[
                  { label: 'Over 7 Days', count: aging.over7Days?.length ?? 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                  { label: 'Over 15 Days', count: aging.over15Days?.length ?? 0, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                  { label: 'Over 30 Days', count: aging.over30Days?.length ?? 0, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                ].map(s => (
                  <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <h4 className="font-bold text-slate-700 text-sm">Pending Over 30 Days ({aging.over30Days?.length ?? 0})</h4>
                  </div>
                  <AgingTable proposals={aging.over30Days} label="30 days" color="text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <h4 className="font-bold text-slate-700 text-sm">Pending Over 15 Days ({aging.over15Days?.length ?? 0})</h4>
                  </div>
                  <AgingTable proposals={aging.over15Days} label="15 days" color="text-orange-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <h4 className="font-bold text-slate-700 text-sm">Pending Over 7 Days ({aging.over7Days?.length ?? 0})</h4>
                  </div>
                  <AgingTable proposals={aging.over7Days} label="7 days" color="text-amber-600" />
                </div>
              </div>
            </div>
          )}

          {/* Stage Delay Report */}
          {activeTab === 1 && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Stage Delay Analysis</h3>
                <p className="text-sm text-slate-500 mt-0.5">Average time proposals spend at each processing stage</p>
              </div>
              <div className="p-6 space-y-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stageDelay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="stageName" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} label={{ value: 'Avg Days', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#94a3b8' } }} />
                    <Tooltip formatter={(v) => [`${v} days`, 'Average Days']} />
                    <Bar dataKey="averageDaysSpent" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Avg Days" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stageDelay.map((stage) => (
                    <div key={stage.stageId} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">{stage.stageName}</p>
                      <p className="text-2xl font-bold text-blue-800">{stage.averageDaysSpent}</p>
                      <p className="text-xs text-slate-500 mt-0.5">avg days · {stage.proposalCount} proposals</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Department Performance */}
          {activeTab === 2 && (
            <div>
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">Department Performance Report</h3>
                <p className="text-sm text-slate-500 mt-0.5">Average proposal processing time by department</p>
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
                                ></div>
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
        </div>
      )}
    </div>
  );
}
