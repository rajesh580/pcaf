import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { studentService } from '../../services/studentService';

export default function StudentResume() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    studentService.getProfile()
      .then((res) => {
        if (res.student && res.student.resumeUrl) {
          setResumeUrl(res.student.resumeUrl);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or DOCX file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setMsg('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeUrl(res.data.fileUrl);
      setMsg('Resume successfully uploaded to Cloudinary storage and linked to your profile in the database!');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Resume & Portfolio Management</h1>
        <p className="text-sm text-slate-500">Upload your PDF resume to Cloudinary or view your auto-generated standardized resume</p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">✅ {msg}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">⚠️ {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Upload New Resume (PDF / DOCX)</h3>
          <p className="text-xs text-slate-500">
            Upload your personal resume file. It will be stored securely on Cloudinary and made accessible to recruiters.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-400 mt-2">Maximum file size: 10MB</p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading to Cloudinary...' : 'Upload & Link Resume'}
            </button>
          </form>
        </div>

        {/* Existing Resume & Standardized View */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Active Linked Resume</h3>
            <p className="text-xs text-slate-500 mb-4">
              Your uploaded resume document accessible to recruiters during shortlisting.
            </p>

            {loading ? (
              <div className="text-xs text-slate-400">Checking resume records...</div>
            ) : resumeUrl ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500 text-lg">📄</span>
                  <span className="text-xs font-semibold text-slate-700">Uploaded_Resume.pdf</span>
                </div>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition"
                >
                  Download / View
                </a>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                No resume uploaded yet. Please select and upload your resume file above.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-1">Standardized Resume Generator (Section 9)</h4>
            <p className="text-xs text-slate-500 mb-3">
              Generate an ATS-compliant, recruiter-standardized resume compiled directly from your verified profile records.
            </p>
            <a
              href="/student/standardized-resume"
              className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              View Standardized Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
