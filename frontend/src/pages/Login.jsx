import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12 text-white"
        style={{
          background: 'linear-gradient(135deg, #0f2440 0%, #1e3a5f 50%, #2563eb 100%)',
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Finance Works</h1>
              <p className="text-blue-300 text-sm">Monitoring System</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4 leading-snug">
            Track Every Proposal.<br />
            At Every Stage.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            A comprehensive system for the Finance Department of North Western Railway
            to monitor proposal movements, track time, and identify bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Proposals Tracked', value: '50+' },
            { label: 'Departments', value: '5' },
            { label: 'Processing Stages', value: '4' },
            { label: 'Days Saved', value: '∞' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-400">{stat.value}</p>
              <p className="text-xs text-blue-200 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">Finance Works</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h3>
            <p className="text-slate-500 text-sm mb-8">Sign in to access the monitoring system</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-600">Demo Credentials:</p>
              <p>Admin: <span className="font-mono">admin / admin123</span></p>
              <p>Officer: <span className="font-mono">finance / finance123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
