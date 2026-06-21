import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dashboardAPI, reportAPI } from '../api/services';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  UNDER_REVIEW: '#3b82f6',
  RETURNED: '#ef4444',
  APPROVED: '#10b981',
  REJECTED: '#9d174d',
  COMPLETED: '#8b5cf6',
};

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="font-semibold text-slate-700 text-sm">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [stageDelay, setStageDelay] = useState([]);
  const [deptPerf, setDeptPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      reportAPI.getStageDelay(),
      reportAPI.getDepartmentPerformance(),
    ]).then(([statsRes, stageRes, deptRes]) => {
      setStats(statsRes.data);
      setStageDelay(stageRes.data);
      setDeptPerf(deptRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const statusData = stats ? [
    { name: 'Pending', value: stats.pendingProposals, color: STATUS_COLORS.PENDING },
    { name: 'Under Review', value: stats.underReviewProposals, color: STATUS_COLORS.UNDER_REVIEW },
    { name: 'Approved', value: stats.approvedProposals, color: STATUS_COLORS.APPROVED },
    { name: 'Completed', value: stats.completedProposals, color: STATUS_COLORS.COMPLETED },
    { name: 'Returned', value: stats.returnedProposals, color: STATUS_COLORS.RETURNED },
    { name: 'Rejected', value: stats.rejectedProposals, color: STATUS_COLORS.REJECTED },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Proposals"
          value={stats?.totalProposals ?? 0}
          subtitle="All time"
          color="#1e3a5f"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Pending"
          value={stats?.pendingProposals ?? 0}
          subtitle="Awaiting action"
          color="#f59e0b"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Completed"
          value={stats?.completedProposals ?? 0}
          subtitle="Finalized"
          color="#10b981"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Returned"
          value={stats?.returnedProposals ?? 0}
          subtitle="Needs revision"
          color="#ef4444"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          }
        />
        <StatCard
          title="Avg. Processing"
          value={`${stats?.averageProcessingDays ?? 0}d`}
          subtitle="Days per proposal"
          color="#8b5cf6"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposal Status Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-4">Proposal Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} proposals`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10">No data available</p>
          )}
        </div>

        {/* Stage-wise Delay Analysis */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-4">Stage-wise Average Delay (Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageDelay} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="stageName"
                tick={{ fontSize: 10, fill: '#64748b' }}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(value) => [`${value} days`, 'Avg. Days']} />
              <Bar dataKey="averageDaysSpent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Department-wise Proposal Count</h3>
          <Link to="/reports" className="text-blue-600 text-sm hover:underline">View Reports →</Link>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptPerf} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
            <Tooltip formatter={(value, name) => [value, name === 'totalProposals' ? 'Total' : 'Completed']} />
            <Legend />
            <Bar dataKey="totalProposals" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" />
            <Bar dataKey="completedProposals" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
