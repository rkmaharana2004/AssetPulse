import React, { useState } from 'react';
import { Activity, Shield, AlertCircle, Wrench, Eye, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-xl shadow-sky-500/20 mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Asset<span className="text-sky-400">Pulse</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Equipment Maintenance & Spare Parts Stock Tracker
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Operations Portal'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-3 text-center">
              Quick 1-Click Role Switcher (Seeded Demo Accounts):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'admin123')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs hover:border-sky-500/50 transition-all"
              >
                <Shield className="w-4 h-4 text-sky-400 mb-1" />
                <span className="font-semibold text-slate-200">Admin</span>
                <span className="text-[10px] text-slate-400">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('engineer', 'eng123')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs hover:border-emerald-500/50 transition-all"
              >
                <Wrench className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-semibold text-slate-200">Engineer</span>
                <span className="text-[10px] text-slate-400">Maintenance</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('viewer', 'view123')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs hover:border-amber-500/50 transition-all"
              >
                <Eye className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-semibold text-slate-200">Viewer</span>
                <span className="text-[10px] text-slate-400">Read-Only</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          AssetPulse ERP &copy; 2026. Enterprise Industrial Reliability Platform.
        </p>
      </div>
    </div>
  );
};
