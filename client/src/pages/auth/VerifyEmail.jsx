import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in the URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully! You can now log in.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification token is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white p-8 border border-slate-200 rounded-xl shadow-sm text-center">
      {status === 'verifying' && (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800">Verifying Your Email...</h2>
          <p className="text-sm text-slate-500">Please wait while we confirm your account in the database.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
          <p className="text-sm text-slate-600">{message}</p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
          <p className="text-sm text-rose-600">{message}</p>
          <div className="pt-4 space-x-3">
            <Link
              to="/register"
              className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-xs font-semibold transition"
            >
              Register Again
            </Link>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
