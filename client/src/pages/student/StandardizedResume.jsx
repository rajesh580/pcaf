import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function StandardizedResume() {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students/standardized-resume')
      .then((res) => {
        setHtmlContent(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load resume');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 text-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Generating ATS-compliant standardized resume from verified records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="font-bold text-slate-800">Recruiter-Ready Standardized Resume</h2>
          <p className="text-xs text-slate-500">Auto-formatted and verified through institutional skill records</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/student"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition"
          >
            ← Back to Dashboard
          </a>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      <div
        className="bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
