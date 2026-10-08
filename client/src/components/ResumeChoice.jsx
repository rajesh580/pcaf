import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ResumeChoice({ student, value, onChange }) {
  const hasUploadedResume = Boolean(student?.resumeUrl);
  const [preview, setPreview] = useState({ url: '', loading: false, error: '' });

  useEffect(() => {
    const previewUrl = preview.url;
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [preview.url]);

  const toggleUploadedPreview = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (preview.url) {
      setPreview({ url: '', loading: false, error: '' });
      return;
    }
    setPreview({ url: '', loading: true, error: '' });
    try {
      const response = await api.get('/upload/resume/preview', { responseType: 'blob' });
      setPreview({ url: URL.createObjectURL(response.data), loading: false, error: '' });
    } catch (error) {
      setPreview({ url: '', loading: false, error: 'Could not preview this uploaded resume. Re-upload it from Resume Management and try again.' });
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Choose the resume for this application</h4>
        <p className="mt-1 text-xs text-slate-600">The recruiter will receive the version you select here.</p>
      </div>
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${value === 'UPLOADED' ? 'border-blue-500 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'} ${!hasUploadedResume ? 'cursor-not-allowed opacity-60' : ''}`}>
        <input type="radio" name="application-resume" value="UPLOADED" checked={value === 'UPLOADED'} disabled={!hasUploadedResume} onChange={() => onChange('UPLOADED')} className="mt-1" />
        <span className="min-w-0 flex-1"><strong className="block text-xs text-slate-900">Uploaded resume</strong><span className="mt-1 block break-all text-[11px] text-slate-500">{hasUploadedResume ? 'Use the PDF or document linked to your profile.' : 'No uploaded resume yet. Upload one above or choose your generated resume.'}</span></span>
        {hasUploadedResume && <button type="button" onClick={toggleUploadedPreview} className="shrink-0 text-[11px] font-semibold text-blue-700 hover:underline">{preview.loading ? 'Loading…' : preview.url ? 'Hide preview' : 'Preview'}</button>}
      </label>
      {preview.error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">{preview.error}</p>}
      {preview.url && <iframe title="Uploaded resume preview" src={preview.url} className="h-72 w-full rounded-lg border border-slate-200 bg-white" />}
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${value === 'GENERATED' ? 'border-blue-500 bg-white ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
        <input type="radio" name="application-resume" value="GENERATED" checked={value === 'GENERATED'} onChange={() => onChange('GENERATED')} className="mt-1" />
        <span className="min-w-0 flex-1"><strong className="block text-xs text-slate-900">Generated profile resume</strong><span className="mt-1 block text-[11px] text-slate-500">Use the standard resume page built from your profile, education, skills, projects, and certifications.</span></span>
        <a href="/student/standardized-resume" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="shrink-0 text-[11px] font-semibold text-blue-700 hover:underline">Preview</a>
      </label>
      {!value && <p className="text-[11px] font-semibold text-amber-800">Select one resume before submitting.</p>}
    </section>
  );
}
