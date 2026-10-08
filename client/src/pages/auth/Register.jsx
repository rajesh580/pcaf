import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import api from '../../services/api';
import { User, Building, GraduationCap, Mail, Lock, Hash, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    setLoading(true);

    try {
      const res = await authService.register({
        ...formData,
        role: 'STUDENT'
      });
      setMsg(res.message || 'Student account created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Hero Panel (Light Theme) */}
        <div className="relative bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-slate-100/80 p-8 md:p-10 text-slate-800 flex flex-col justify-between overflow-hidden hidden md:flex border-r border-slate-200/70">
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" /> Student Registration
            </div>
            
            <h2 className="text-3xl font-bold font-display text-slate-900 leading-tight">
              Start Your Journey From Campus to Placement
            </h2>
            
            <p className="text-slate-600 text-xs leading-relaxed">
              Create your student profile, connect with registered partner colleges, build ATS-optimized resumes, and land top internship and job drives.
            </p>
          </div>

          <div className="space-y-3.5 relative z-10 pt-8 border-t border-slate-200/80 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Verified academic institution matching</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Direct access to campus placement drives</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span>Free ATS standardized resume generator</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel (Light Theme) */}
        <div className="p-8 md:p-10 flex flex-col justify-center space-y-5 bg-white">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Create Student Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your institution to link academic verification & placement drives.
            </p>
          </div>

          {msg && (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl border border-emerald-200">
              <p className="font-bold">✉️ Verification Sent</p>
              <p className="text-xs mt-0.5">{msg}</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-800 text-xs font-semibold p-3.5 rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 pr-4 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>

            {/* College Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Registered College / Institution <span className="text-rose-500">*</span>
              </label>
              {loadingColleges ? (
                <div className="text-xs text-slate-400 py-2">Loading institutions...</div>
              ) : (
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    required
                    value={formData.collegeId}
                    onChange={handleCollegeChange}
                    className="pl-10 pr-4 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium text-slate-800"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Department Selection */}
            {selectedCollegeDepts.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Department / Branch
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="pl-10 pr-4 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                  >
                    {selectedCollegeDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Roll No / USN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                College Roll No. / USN
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.usn}
                  onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                  className="pl-10 pr-4 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                  placeholder="1RV21CS085 (Optional)"
                />
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                    placeholder="student@edu.in"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || colleges.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Register as Student'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
