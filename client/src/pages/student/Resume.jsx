import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { studentService } from '../../services/studentService';

export default function StudentResume() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadResumePreview = async () => {
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const res = await api.get('/upload/resume/preview', { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      console.warn('Resume preview failed:', err);
      setPreviewError(true);
      setPreviewBlobUrl('');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    studentService.getProfile()
      .then((res) => {
        if (res.student && res.student.resumeUrl) {
          setResumeUrl(res.student.resumeUrl);
          loadResumePreview();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const response = await api.get('/upload/resume/download', { responseType: 'blob' });
      const disposition = response.headers['content-disposition'] || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'resume.pdf';
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Resume download failed. Please re-upload your resume PDF.');
    } finally {
      setDownloading(false);
    }
  };

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
      setMsg('Resume uploaded successfully to local storage & linked to your profile!');
      await loadResumePreview();
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
        <p className="text-sm text-slate-500">Upload your PDF resume or view your auto-generated standardized resume</p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">✅ {msg}</div>}
      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">⚠️ {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Upload Resume File (PDF / DOCX)</h3>
          <p className="text-xs text-slate-500">
            Upload your resume document. It will be stored securely on the portal server and made instantly available for viewing & downloading.
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
              {uploading ? 'Uploading resume...' : 'Upload & Link Resume'}
            </button>
          </form>
        </div>

        {/* Existing Resume & Standardized View */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Active Linked Resume</h3>
            <p className="text-xs text-slate-500 mb-4">
              Your active uploaded resume document accessible to recruiters during shortlisting.
            </p>

            {loading ? (
              <div className="text-xs text-slate-400">Checking resume records...</div>
            ) : resumeUrl ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500 text-lg">📄</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {resumeUrl.startsWith('/uploads/') ? 'Uploaded_Resume.pdf' : 'Cloudinary_Resume.pdf'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="text-xs bg-slate-800 text-white px-3.5 py-1.5 rounded hover:bg-slate-700 transition font-semibold"
                  >
                    {downloading ? 'Preparing…' : '📥 Download Resume'}
                  </button>
                </div>
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
              Generate an ATS-compliant, recruiter-standardized resume compiled directly from your profile records.
            </p>
            <a
              href="/student/standardized-resume"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              View Standardized Resume
            </a>
          </div>
        </div>
      </div>

      {/* In-Page Resume Viewer */}
      {resumeUrl && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>👁️</span> In-Page Uploaded Resume Viewer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preview your active uploaded document directly within the application
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              Download PDF ↗
            </button>
          </div>

          <div className="w-full h-[550px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {previewLoading ? (
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading resume preview...</span>
              </div>
            ) : previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                className="w-full h-full border-0"
                title="Uploaded Student Resume Document"
              />
            ) : (
              <div className="text-center p-6 space-y-2 max-w-md">
                <div className="text-amber-500 text-3xl">⚠️</div>
                <h4 className="text-sm font-bold text-slate-800">Resume File Access Restricted or Unavailable</h4>
                <p className="text-xs text-slate-500">
                  {previewError
                    ? 'The previous Cloudinary document URL access is restricted. Please re-upload your resume PDF above to save it locally on the server for instant previewing.'
                    : 'Select a PDF file above and click Upload to enable in-page preview.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
