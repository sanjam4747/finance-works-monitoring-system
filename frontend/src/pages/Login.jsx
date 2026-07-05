import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[38%] p-12 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(150deg, #0f2440 0%, #1e3a5f 55%, #2563eb 100%)' }}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Finance Works</h1>
              <p className="text-blue-300 text-[0.8125rem]">Monitoring System</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold mb-4 leading-snug">
            Track Every Proposal.<br />
            At Every Stage.
          </h2>
          <p className="text-blue-200 text-[0.875rem] leading-relaxed max-w-xs">
            A comprehensive system for the Finance Department of North Western Railway
            to monitor proposal movements, track time, and identify bottlenecks.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Proposals Tracked',   value: '50+' },
            { label: 'Departments',          value: '5'   },
            { label: 'Processing Stages',    value: '4'   },
            { label: 'Days Saved',           value: '∞'   },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xl font-bold text-amber-400 tabular-nums">{stat.value}</p>
              <p className="text-[0.75rem] text-blue-200 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-100 px-4 sm:px-8 py-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-7">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">Finance Works</span>
          </div>

          <div className="card p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Welcome Back</h3>
            <p className="text-slate-400 text-[0.8125rem] mb-7">Sign in to access the monitoring system</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="form-input"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[0.8125rem] rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[0.6875rem] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Demo Credentials</p>
              <div className="space-y-0.5 text-[0.6875rem] text-slate-500">
                <p>Admin: <span className="font-mono font-semibold text-slate-700">admin / admin123</span></p>
                <p>Officer: <span className="font-mono font-semibold text-slate-700">finance / finance123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
