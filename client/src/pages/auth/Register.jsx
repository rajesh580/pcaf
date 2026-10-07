import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import api from '../../services/api';

export default function Register() {
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegeId: '',
    usn: '',
    departmentId: ''
  });

  const [selectedCollegeDepts, setSelectedCollegeDepts] = useState([]);
  const [msg, setMsg] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/college/registered')
      .then((res) => {
        const list = res.data.colleges || [];
        setColleges(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, collegeId: list[0].id }));
          setSelectedCollegeDepts(list[0].departments || []);
          if (list[0].departments && list[0].departments.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: list[0].departments[0].id }));
          }
        }
      })
      .catch((err) => console.error('Error fetching colleges:', err))
      .finally(() => setLoadingColleges(false));
  }, []);

  const handleCollegeChange = (e) => {
    const colId = e.target.value;
    const col = colleges.find((c) => c.id === colId);
    setFormData((prev) => ({
      ...prev,
      collegeId: colId,
      departmentId: col?.departments?.[0]?.id || ''
    }));
    setSelectedCollegeDepts(col?.departments || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setVerifyUrl('');
    setLoading(true);

    try {
      const res = await authService.register({
        ...formData,
        role: 'STUDENT' // Enforced to STUDENT
      });
      setMsg(res.message || 'Student account created successfully!');
      if (res.verificationUrl) {
        setVerifyUrl(res.verificationUrl);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-white p-8 border border-slate-200 rounded-xl shadow-sm">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          Student Portal Registration
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">Create Student Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select your registered institution to link academic verification, internships, and placement opportunities.
        </p>
      </div>

      {msg && (
        <div className="bg-emerald-50 text-emerald-800 text-sm p-4 rounded-lg mb-4 border border-emerald-200">
          <p className="font-semibold">✉️ Check Your Email</p>
          <p className="text-xs text-emerald-700 mt-1">{msg}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Rahul Sharma"
          />
        </div>

        {/* College Selection (Required) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Registered College / Institution <span className="text-red-500">*</span>
          </label>
          {loadingColleges ? (
            <div className="text-xs text-slate-400 py-2">Loading registered institutions...</div>
          ) : (
            <select
              required
              value={formData.collegeId}
              onChange={handleCollegeChange}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Department Selection (if any) */}
        {selectedCollegeDepts.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Department / Branch
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedCollegeDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* University Seat Number (USN) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            College Roll No. / USN
          </label>
          <input
            type="text"
            value={formData.usn}
            onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 1RV21CS085 (Optional)"
          />
        </div>

        {/* Student Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="student@rvce.edu"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimum 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading || colleges.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Creating Student Profile...' : 'Register as Student'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
        <p className="text-[11px] text-slate-400">
          * College administrators, corporate recruiters, and mentors are provisioned directly by the Platform Super Administrator.
        </p>
      </div>
    </div>
  );
}
