import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dashboardAPI, reportAPI } from '../api/services';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  PENDING:      '#f59e0b',
  UNDER_REVIEW: '#3b82f6',
  RETURNED:     '#ef4444',
  APPROVED:     '#10b981',
  REJECTED:     '#9d174d',
  COMPLETED:    '#8b5cf6',
};

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div className="card card-hover fade-in p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <span className="text-2xl font-bold text-slate-800 tabular-nums">{value}</span>
      </div>
      <div className="mt-3">
        <p className="text-[0.8125rem] font-semibold text-slate-700 leading-tight">{title}</p>
        {subtitle && <p className="text-[0.6875rem] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, action }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[0.875rem] font-bold text-slate-800">{title}</h3>
        {action && action}
      </div>
      <div className="p-5 w-full overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [stageDelay, setStageDelay] = useState([]);
  const [deptPerf, setDeptPerf]   = useState([]);
  const [myStats, setMyStats]     = useState(null);
  const [officerPerf, setOfficerPerf] = useState([]);
  const [loading, setLoading]     = useState(true);
  const { user } = useAuth();

  const isAdmin    = user?.role === 'ADMIN';
  const isAccounts = user?.role === 'ACCOUNTS_USER';

  useEffect(() => {
    const calls = [dashboardAPI.getStats()];
    if (isAdmin || isAccounts) {
      calls.push(reportAPI.getStageDelay(), reportAPI.getDepartmentPerformance());
    }
    if (!isAdmin) {
      calls.push(dashboardAPI.getMyStats());
    } else {
      calls.push(reportAPI.getOfficerPerformance());
    }
    Promise.all(calls.map(p => p.catch(() => ({ data: null })))).then(results => {
      setStats(results[0].data);
      let idx = 1;
      if (isAdmin || isAccounts) {
        if (results[idx]) setStageDelay(results[idx].data || []);
        idx++;
        if (results[idx]) setDeptPerf(results[idx].data || []);
        idx++;
      }
      if (!isAdmin && results[idx]) setMyStats(results[idx].data);
      if (isAdmin && results[idx]) setOfficerPerf(results[idx].data || []);
    }).finally(() => setLoading(false));
  }, [isAdmin, isAccounts]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const statusData = stats ? [
    { name: 'Pending',      value: stats.pendingProposals,    color: STATUS_COLORS.PENDING },
    { name: 'Under Review', value: stats.underReviewProposals, color: STATUS_COLORS.UNDER_REVIEW },
    { name: 'Approved',     value: stats.approvedProposals,   color: STATUS_COLORS.APPROVED },
    { name: 'Completed',    value: stats.completedProposals,  color: STATUS_COLORS.COMPLETED },
    { name: 'Returned',     value: stats.returnedProposals,   color: STATUS_COLORS.RETURNED },
    { name: 'Rejected',     value: stats.rejectedProposals,   color: STATUS_COLORS.REJECTED },
  ].filter(d => d.value > 0) : [];

  const iconProps = { xmlns: "http://www.w3.org/2000/svg", className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  return (
    <div className="space-y-5 fade-in">

      {/* ── Row 1: Primary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Proposals" value={stats?.totalProposals ?? 0} subtitle="All time"
          color="#1e3a5f"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          title="Pending" value={stats?.pendingProposals ?? 0} subtitle="Awaiting action"
          color="#f59e0b"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Completed" value={stats?.completedProposals ?? 0} subtitle="Finalized"
          color="#10b981"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Returned" value={stats?.returnedProposals ?? 0} subtitle="Needs revision"
          color="#ef4444"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
        />
      </div>

      {/* ── Row 2: Processing Times ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Avg. Processing Time" value={`${stats?.averageProcessingDays ?? 0}d`} subtitle="Overall per proposal"
          color="#8b5cf6"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          title="Avg. Executive Dept. Time" value={`${stats?.avgExecutiveDepartmentDays ?? 0}d`} subtitle="At Executive Department"
          color="#3b82f6"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          title="Avg. Accounts Dept. Time" value={`${stats?.avgAccountsDepartmentDays ?? 0}d`} subtitle="At Accounts Department"
          color="#06b6d4"
          icon={<svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
      </div>

      {/* ── Row 3: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <ChartCard title="Status Distribution">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} proposals`, '']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10 text-sm">No data available</p>
          )}
        </ChartCard>

        <ChartCard title="Department Processing Time (Days)">
          {stageDelay.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageDelay} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="stageName"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [`${value} days`, 'Avg. Days']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="averageDaysSpent" radius={[6, 6, 0, 0]} name="Avg Days">
                  {stageDelay.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.stageName === 'Executive Department' ? '#3b82f6' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10 text-sm">No stage data available</p>
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Department Count (Admin/Accounts) ── */}
      {(isAdmin || isAccounts) && deptPerf.length > 0 && (
        <ChartCard
          title="Department-wise Proposal Count"
          action={
            <Link to="/reports" className="text-[0.75rem] text-blue-600 hover:text-blue-800 font-medium transition-colors">
              View Reports →
            </Link>
          }
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptPerf} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
              <Tooltip
                formatter={(value, name) => [value, name === 'totalProposals' ? 'Total' : 'Completed']}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="totalProposals"     fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" />
              <Bar dataKey="completedProposals" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Row 5: Personal Officer Stats (non-admin) ── */}
      {!isAdmin && myStats && (
        <div>
          <h3 className="text-[0.875rem] font-bold text-slate-700 mb-3">My Assignment Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Assigned To Me" value={myStats.assignedToMe ?? 0} subtitle="Active in my queue"
              color="#1e3a5f"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <StatCard
              title="Pending Reviews" value={myStats.pendingReviews ?? 0} subtitle="Awaiting my action"
              color="#f59e0b"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Returned To Me" value={myStats.returnedToMe ?? 0} subtitle="Needs my revision"
              color="#ef4444"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
            />
            <StatCard
              title="Completed Today" value={myStats.completedToday ?? 0} subtitle="Finalized today"
              color="#10b981"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        </div>
      )}

      {/* ── Row 6: Admin Officer Performance Table ── */}
      {isAdmin && officerPerf.length > 0 && (
        <ChartCard title="Officer Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8125rem] border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {['Officer', 'Department', 'Active', 'Created', 'Forwarded', 'Returned', 'Approved', 'Completed', 'Avg Days'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officerPerf.map(o => (
                  <tr key={o.userId} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0">
                          {o.fullName.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">{o.fullName}</p>
                          <p className="text-[0.6875rem] text-slate-400">{o.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{o.departmentName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold ${o.currentlyAssigned > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{o.currentlyAssigned}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{o.totalCreated}</td>
                    <td className="px-3 py-2.5 text-slate-700">{o.totalForwarded}</td>
                    <td className="px-3 py-2.5 text-amber-600 font-medium">{o.totalReturned}</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-medium">{o.totalApproved}</td>
                    <td className="px-3 py-2.5 text-purple-600 font-medium">{o.totalCompleted}</td>
                    <td className="px-3 py-2.5 text-slate-600">{o.averageProcessingDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
