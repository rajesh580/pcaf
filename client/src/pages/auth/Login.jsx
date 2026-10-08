import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.routing && res.routing.dashboardRoute) {
        navigate(res.routing.dashboardRoute);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Hero Panel (Light Theme) */}
        <div className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-slate-100/80 p-8 md:p-10 text-slate-800 flex flex-col justify-between overflow-hidden hidden md:flex border-r border-slate-200/70">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> PFAC Collaboration Engine
            </div>
            
            <h2 className="text-3xl font-bold font-display text-slate-900 leading-tight">
              Empowering Students & Industry Talent Drives
            </h2>
            
            <p className="text-slate-600 text-xs leading-relaxed">
              Unified portal for skill mapping, standardized ATS resume generation, internship placements, and corporate recruitment pipelines.
            </p>
          </div>

          <div className="space-y-3.5 relative z-10 pt-8 border-t border-slate-200/80 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Real-time skill gap analysis & course matching</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Automated ATS standardized resume exporter</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Verified academic & institutional credentials</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel (Light Theme) */}
        <div className="p-8 md:p-10 flex flex-col justify-center space-y-6 bg-white">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Sign in to Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back! Please enter your account credentials.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-800 text-xs font-semibold p-3.5 rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email / Institutional ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
