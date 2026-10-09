import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Mail, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setResetToken('');

    try {
      const res = await authService.forgotPassword(email);
      setStatus(res.message || 'A reset link has been dispatched to your email address.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      setStatus(err.response?.data?.error || 'Request processed. Please check your inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 border border-slate-200 rounded-2xl shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900">Reset Password</h2>
          <p className="text-xs text-slate-500">
            Enter your registered email address to receive a password reset link.
          </p>
        </div>

        {status && (
          <div className="bg-blue-50 text-blue-900 text-xs p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{status}</span>
            </div>

            {resetToken && (
              <div className="pt-2 border-t border-blue-200/80">
                <p className="font-semibold text-blue-950 mb-1">Direct Reset Link:</p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  <span>Open Password Reset Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Registered Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4 py-3 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                placeholder="user@institution.edu"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Sending link...' : 'Send Password Reset Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Remembered your credentials?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
