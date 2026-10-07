import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setStatus(res.message);
    } catch (err) {
      setStatus('Request completed. Please verify your inbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 border border-slate-200 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h2>
      <p className="text-sm text-slate-500 mb-6">Enter your email to receive a secure recovery link</p>

      {status && (
        <div className="bg-blue-50 text-blue-800 text-sm p-3.5 rounded mb-4 border border-blue-200">
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Registered Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@institution.edu"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Password Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Remembered your credentials?{' '}
        <Link to="/login" className="text-blue-600 font-semibold hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}
