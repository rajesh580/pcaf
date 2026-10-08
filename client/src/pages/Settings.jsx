import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';

const formatRole = (role = '') => role.toLowerCase().split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');

export default function Settings() {
  const [user, setUser] = useState(() => authService.getCurrentUser() || {});
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/profile').then(({ data }) => {
      if (!active) return;
      setUser((current) => ({ ...current, ...data.profile }));
      if (data.profile?.photoUrl) authService.updateCurrentUser({ photoUrl: data.profile.photoUrl });
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setMessage('');
    setError('');
    if (!selectedFile) return setFile(null);
    if (!selectedFile.type.startsWith('image/')) {
      setFile(null);
      setError('Choose an image file such as JPG, PNG, or WebP.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setError('The image must be 5 MB or smaller.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a profile picture before uploading.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = authService.updateCurrentUser({ photoUrl: data.photoUrl });
      setUser(updatedUser || { ...user, photoUrl: data.photoUrl });
      setFile(null);
      setMessage('Profile picture saved. It is now stored in Cloudinary and linked to your account.');
    } catch (uploadError) {
      setError(uploadError.response?.data?.error || 'The profile picture could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayImage = previewUrl || user.photoUrl;
  const initials = (user.name || user.email || 'U').trim().slice(0, 1).toUpperCase();

  return (
    <div className="settings-page space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account picture and basic profile details.</p>
      </header>

      <section className="max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-bold text-slate-900">Profile picture</h2>
          <p className="mt-1 text-sm text-slate-500">This picture appears beside your name throughout the portal.</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-100 text-3xl font-semibold text-slate-600">
              {displayImage ? <img src={displayImage} alt="Profile preview" className="h-full w-full object-cover" /> : initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.name || 'Your account'}</p>
              <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
              <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {formatRole(user.role)}
              </span>
            </div>
          </div>

          {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <label htmlFor="profile-picture" className="block text-sm font-semibold text-slate-700">Choose a picture</label>
            <input
              id="profile-picture"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 file:shadow-sm hover:file:bg-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP, or GIF · up to 5 MB</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!file || uploading} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? 'Uploading picture…' : 'Save profile picture'}
            </button>
            {file && <span className="text-sm text-slate-500">{file.name}</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
