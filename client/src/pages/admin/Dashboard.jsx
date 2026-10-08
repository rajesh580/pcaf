import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const TabIcons = {
  overview: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  students: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147L12 14.634l7.74-4.487m-15.48 0L12 5.66l7.74 4.487m-15.48 0v4.206c0 1.055.604 2.023 1.554 2.502L12 19.986l6.186-3.131c.95-.479 1.554-1.447 1.554-2.502v-4.206" />
    </svg>
  ),
  colleges: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5" />
    </svg>
  ),
  companies: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  broadcast: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.38-.09-2.072-.09M7.5 10.5A2.25 2.25 0 005.25 12.75v.516a2.25 2.25 0 002.25 2.25h.582M19.5 12c0 2.25-1.875 4.5-4.5 4.5H12M19.5 12A4.5 4.5 0 0015 7.5H12m7.5 4.5a.75.75 0 01-.75.75H12" />
    </svg>
  ),
  audit: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
    </svg>
  )
};

const ALL_ROLES = [
  'STUDENT',
  'COLLEGE_ADMIN',
  'DEPARTMENT_ADMIN',
  'FACULTY_COORDINATOR',
  'COMPANY_ADMIN',
  'COMPANY_RECRUITER',
  'SKILL_PROVIDER',
  'MENTOR',
  'PLATFORM_ADMIN',
  'SUPER_ADMIN'
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResume, setStudentResume] = useState({ url: '', loading: false, error: '' });
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [broadcastsList, setBroadcastsList] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'students', 'overview', 'colleges', 'companies', 'broadcast', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/dashboard/admin?tab=${tabId}`, { replace: true });
  };

  // Forms
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    collegeId: '',
    departmentId: '',
    companyId: '',
    companyName: ''
  });
  const [newCollegeForm, setNewCollegeForm] = useState({ name: '', code: '' });
  const [addingCollege, setAddingCollege] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', website: '' });
  const [editingCompany, setEditingCompany] = useState(null);
  const [editCompanyForm, setEditCompanyForm] = useState({ name: '', website: '', status: 'APPROVED' });
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', targetAudience: 'ALL' });

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [dashRes, usersRes, studentsRes, clgRes, compRes, auditRes, notifRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/students'),
        api.get('/admin/colleges'),
        api.get('/admin/companies'),
        api.get('/admin/audit-logs'),
        api.get('/admin/notifications')
      ]);

      if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
      if (usersRes.status === 'fulfilled') {
        const uList = usersRes.value.data?.users || [];
        setUsers(uList);
      }
      if (studentsRes.status === 'fulfilled') {
        const sList = studentsRes.value.data?.students || [];
        setStudents(sList);
      }
      if (clgRes.status === 'fulfilled') setColleges(clgRes.value.data?.colleges || []);
      if (compRes.status === 'fulfilled') setCompanies(compRes.value.data?.companies || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data?.auditLogs || []);
      if (notifRes.status === 'fulfilled') setBroadcastsList(notifRes.value.data?.notifications || []);
    } catch (err) {
      console.error('loadData error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const previewUrl = studentResume.url;
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [studentResume.url]);

  const openStudentProfile = (student) => {
    setSelectedStudent(student);
    setActiveTab('student-profile');
    if (student.studentProfile?.resumeUrl) loadStudentResume(student.id);
    else setStudentResume({ url: '', loading: false, error: '' });
  };

  const loadStudentResume = async (studentUserId = selectedStudent?.id) => {
    if (!studentUserId) return;
    setStudentResume({ url: '', loading: true, error: '' });
    try {
      const response = await api.get(`/admin/students/${studentUserId}/resume`, { responseType: 'blob' });
      setStudentResume({ url: URL.createObjectURL(response.data), loading: false, error: '' });
    } catch (err) {
      setStudentResume({ url: '', loading: false, error: 'Could not load this resume. It may be missing or not available as a PDF.' });
    }
  };

  // 1. Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/admin/users', newUserForm);
      setMsg(res.data.message || 'User created successfully!');
      setNewUserForm({ name: '', email: '', password: '', role: 'STUDENT', collegeId: '', departmentId: '', companyId: '', companyName: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // 2. Delete User
  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/users/${id}`);
      setMsg(`User ${email} deleted successfully.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // 3. College Management
  const handleAddCollege = async (e) => {
    e.preventDefault();
    setAddingCollege(true);
    setMsg('');
    setErrorMsg('');
    try {
      await api.post('/admin/colleges', newCollegeForm);
      setMsg(`College ${newCollegeForm.name} registered.`);
      setNewCollegeForm({ name: '', code: '' });
      await loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setAddingCollege(false);
    }
  };

  const handleDeleteCollege = async (id, name) => {
    if (!window.confirm(`Delete college ${name}?`)) return;
    try {
      await api.delete(`/admin/colleges/${id}`);
      setMsg(`College ${name} removed.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // 4. Company Management
  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/companies', newCompanyForm);
      setMsg(`Company ${newCompanyForm.name} registered.`);
      setNewCompanyForm({ name: '', website: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Delete company ${name}?`)) return;
    try {
      await api.delete(`/admin/companies/${id}`);
      setMsg(`Company ${name} removed.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleCompanyStatus = async (id, status) => {
    try {
      await api.patch(`/admin/companies/${id}/status`, { status });
      setMsg(`Company status updated to ${status.replaceAll('_', ' ')}.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleOpenEditCompany = (comp) => {
    setEditingCompany(comp);
    setEditCompanyForm({
      name: comp.name || '',
      website: comp.website || '',
      status: comp.status || 'APPROVED'
    });
  };

  const handleUpdateCompanyDetails = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    setUpdatingCompany(true);
    setMsg('');
    setErrorMsg('');
    try {
      await api.put(`/admin/companies/${editingCompany.id}`, editCompanyForm);
      setMsg(`Company "${editCompanyForm.name}" updated successfully!`);
      setEditingCompany(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setUpdatingCompany(false);
    }
  };

  // 5. Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications', notifForm);
      setMsg('Broadcast notification sent and dispatched successfully!');
      setNotifForm({ title: '', message: '', targetAudience: 'ALL' });
      const notifRes = await api.get('/admin/notifications');
      setBroadcastsList(notifRes.data?.notifications || []);
    } catch (err) {
      setErrorMsg('Broadcast failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Live Platform System
            </span>
            <span className="text-xs font-mono text-slate-400">PostgreSQL Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Platform Super Administration</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Institutional registries, user provisioning, student rosters, system broadcast notifications, and security audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            type="button"
            onClick={() => handleTabChange('broadcast')}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm shadow-blue-500/20 space-x-2"
          >
            {TabIcons.broadcast}
            <span>Post Broadcast</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('audit')}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all space-x-2"
          >
            {TabIcons.audit}
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Styled Admin Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', iconKey: 'overview', count: null },
            { id: 'users', label: 'User Directory', iconKey: 'users', count: users.length },
            { id: 'students', label: 'Student Profiles', iconKey: 'students', count: students.length },
            { id: 'colleges', label: 'Colleges', iconKey: 'colleges', count: colleges.length },
            { id: 'companies', label: 'Industry Partners', iconKey: 'companies', count: companies.length },
            { id: 'broadcast', label: 'System Broadcast', iconKey: 'broadcast', count: broadcastsList.length },
            { id: 'audit', label: 'Audit Trail', iconKey: 'audit', count: auditLogs.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span>{TabIcons[tab.iconKey]}</span>
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-blue-300 border border-slate-700'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {activeTab === 'student-profile' && (
            <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-white shadow-sm ml-auto">
              <span>👤</span>
              <span>Active Student Profile</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentResume({ url: '', loading: false, error: '' });
                  handleTabChange('students');
                }}
                className="ml-2 font-bold hover:text-amber-100"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm flex justify-between">
          <span>✅ {msg}</span>
          <button onClick={() => setMsg('')} className="font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-sm flex justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="font-bold">×</button>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Add User Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add New Platform User</h2>
            <p className="text-xs text-slate-500 mb-4">Provision administrators, department admins, coordinators, or students linked to institutional records</p>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@college.edu"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 font-medium"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {['COLLEGE_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT'].includes(newUserForm.role) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned College</label>
                  <select
                    value={newUserForm.collegeId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, collegeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-blue-50/60 font-medium"
                  >
                    <option value="">-- Select Registered College --</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {['DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT'].includes(newUserForm.role) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science (CSE)"
                    value={newUserForm.departmentId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}

              {['COMPANY_ADMIN', 'COMPANY_RECRUITER'].includes(newUserForm.role) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Partner Company</label>
                  <select
                    value={newUserForm.companyId || ''}
                    onChange={(e) => {
                      const selectedComp = companies.find((c) => c.id === e.target.value);
                      setNewUserForm({
                        ...newUserForm,
                        companyId: e.target.value,
                        companyName: selectedComp ? selectedComp.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-blue-50/60 font-medium text-slate-800"
                  >
                    <option value="">
                      {companies.length > 0 ? '-- Select Added Company --' : '-- No Companies Added Yet --'}
                    </option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  Create & Provision User
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Provisioned Users in PostgreSQL Database</h3>
                <p className="text-xs text-slate-500">Live records from the User table</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                Total Users: {users.length}
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">College / Dept</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {u.college?.name || u.college?.code || '—'}
                      {u.department?.code ? ` (${u.department.code})` : ''}
                    </td>
                    <td className="py-3 px-4 text-xs">{u.isVerified ? '✅ Verified' : '⏳ Unverified'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded border border-rose-200 transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Students Inspection */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Student Accounts & Candidate Profiles</h2>
              <p className="text-xs text-slate-500">Live list of registered student candidates across colleges</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">
              Total Students: {students.length}
            </span>
          </div>
          {students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No students currently registered in the database.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4"><button type="button" onClick={() => openStudentProfile(s)} className="text-left font-semibold text-slate-800 hover:text-blue-700">{s.name || '—'}<span className="mt-0.5 block text-[10px] font-medium text-blue-600">View full profile →</span></button></td>
                    <td className="py-3 px-4 text-slate-600">{s.email}</td>
                    <td className="py-3 px-4 text-slate-500">{s.studentProfile?.college?.name || 'Not mapped'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{s.studentProfile?.usn || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{s.studentProfile?.cgpa ? s.studentProfile.cgpa.toFixed(2) : '—'}</td>
                    <td className="py-3 px-4 text-xs">{s.isVerified ? '✅ Active' : '⏳ Pending'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(s.id, s.email)}
                        className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded border border-rose-200 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Real Live Database Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase">Registered Users</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalUsers || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase">Students</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{kpis.totalStudents || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase">Approved Colleges</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis.totalColleges || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500 uppercase">Approved Companies</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{kpis.totalCompanies || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Colleges Management & Removal */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-lg">
            <h3 className="font-semibold text-slate-800 mb-3">Add Approved College</h3>
            <form onSubmit={handleAddCollege} className="relative z-10 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RV College of Engineering"
                  value={newCollegeForm.name}
                  onChange={(e) => setNewCollegeForm({ ...newCollegeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">College Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RVCE"
                  value={newCollegeForm.code}
                  onChange={(e) => setNewCollegeForm({ ...newCollegeForm, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button type="submit" disabled={addingCollege} className="relative z-10 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:cursor-wait disabled:opacity-60">
                {addingCollege ? 'Adding College…' : 'Add College'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Approved Colleges</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Total: {colleges.length}</span>
            </div>
            {colleges.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No colleges registered yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">College Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {colleges.map((clg) => (
                    <tr key={clg.id}>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <Link to={`/admin/colleges/${clg.id}`} className="hover:text-blue-600 hover:underline">
                          {clg.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{clg.code}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-600">{clg.status}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/colleges/${clg.id}`}
                          className="mr-2 inline-block text-xs bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded border border-blue-200 transition"
                        >
                          Open portal
                        </Link>
                        <button
                          onClick={() => handleDeleteCollege(clg.id, clg.name)}
                          className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded border border-rose-200 transition"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Companies Management & Removal */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-lg">
            <h3 className="font-semibold text-slate-800 mb-3">Add Partner Company</h3>
            <form onSubmit={handleAddCompany} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infosys Limited"
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
                <input
                  type="text"
                  placeholder="https://infosys.com"
                  value={newCompanyForm.website}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, website: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Add Company
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Approved Partner Companies</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Total: {companies.length}</span>
            </div>
            {companies.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No partner companies registered yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Website</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((comp) => {
                    const linkedUsersCount = (comp.recruiters || []).length || users.filter(u => u.recruiterAtId === comp.id || u.recruiterAt?.id === comp.id).length;
                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <Link to={`/admin/companies/${comp.id}`} className="hover:text-blue-600 font-bold hover:underline flex items-center space-x-1">
                            <span>🏢 {comp.name}</span>
                          </Link>
                          <div className="text-[10px] text-slate-400 font-normal">ID: {comp.id}</div>
                        </td>
                        <td className="py-3 px-4 text-blue-600 text-xs underline">
                          <a href={comp.website} target="_blank" rel="noreferrer">{comp.website || '—'}</a>
                        </td>
                        <td className="py-3 px-4">
                          <select value={comp.status || 'PENDING_VERIFICATION'} onChange={(event) => handleCompanyStatus(comp.id, event.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold">
                            {['PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link
                            to={`/admin/companies/${comp.id}`}
                            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg font-semibold shadow-sm transition inline-flex items-center space-x-1"
                          >
                            <span>🏢 Open Company Dashboard ({linkedUsersCount})</span>
                          </Link>
                          <button
                            onClick={() => handleOpenEditCompany(comp)}
                            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium transition"
                          >
                            ✏️ Quick Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(comp.id, comp.name)}
                            className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1.5 rounded-lg border border-rose-200 transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit Company & Linked Users Modal */}
          {editingCompany && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                      Company Management
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{editingCompany.name}</h2>
                  </div>
                  <button
                    onClick={() => setEditingCompany(null)}
                    className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                  {/* 1. Edit Company Details Form */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Edit Company Information</h3>
                    <form onSubmit={handleUpdateCompanyDetails} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                          <input
                            type="text"
                            required
                            value={editCompanyForm.name}
                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Website URL</label>
                          <input
                            type="text"
                            value={editCompanyForm.website}
                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, website: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            placeholder="https://company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Verification Status</label>
                          <select
                            value={editCompanyForm.status}
                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium"
                          >
                            <option value="APPROVED">APPROVED</option>
                            <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingCompany(null)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatingCompany}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          {updatingCompany ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 2. Users Related to this Company */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        👥 Users Linked to {editingCompany.name}
                      </h3>
                      {(() => {
                        const relUsers = users.filter(u => u.recruiterAtId === editingCompany.id || u.recruiterAt?.id === editingCompany.id || (editingCompany.recruiters || []).some(r => r.id === u.id));
                        return (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                            Total Users: {relUsers.length}
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const relUsers = users.filter(u => u.recruiterAtId === editingCompany.id || u.recruiterAt?.id === editingCompany.id || (editingCompany.recruiters || []).some(r => r.id === u.id));
                      if (relUsers.length === 0) {
                        return (
                          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                            No users linked to this company yet. You can provision users for this company under the 👥 <strong>Users</strong> tab.
                          </div>
                        );
                      }
                      return (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Name</th>
                                <th className="py-2.5 px-3">Email</th>
                                <th className="py-2.5 px-3">Role</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Created</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {relUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-semibold text-slate-800">{u.name || '—'}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                      {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. Opportunities posted by this Company */}
                  {(editingCompany.opportunities || []).length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        🎯 Opportunities Posted ({editingCompany.opportunities.length})
                      </h3>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Title</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {editingCompany.opportunities.map((opp) => (
                              <tr key={opp.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{opp.title}</td>
                                <td className="py-2.5 px-3 text-slate-600">{opp.type}</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                    {opp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setEditingCompany(null)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Broadcast Form & History */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl">
            <h2 className="font-semibold text-slate-800 mb-4">Send System-Wide Broadcast Notification</h2>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                <select
                  value={notifForm.targetAudience}
                  onChange={(e) => setNotifForm({ ...notifForm, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50"
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="COLLEGES">College Administrators Only</option>
                  <option value="COMPANIES">Companies & Recruiters Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g. System Maintenance Notice"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notification Message</label>
                <textarea
                  required
                  rows={3}
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Detailed announcement content..."
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition shadow-sm"
              >
                📢 Send Broadcast Notification
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-semibold text-sm text-slate-800">Broadcast Dispatch History</h2>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                Total Broadcasts: {broadcastsList.length}
              </span>
            </div>
            {broadcastsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No system broadcasts dispatched yet. Use the form above to post announcements.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Title / Announcement</th>
                    <th className="py-3 px-4">Message Body</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {broadcastsList.map((b, i) => (
                    <tr key={b.id || i} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.title}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{b.body || b.message}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold text-[10px]">
                          {b.recipientRole || b.targetAudience || 'ALL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(b.timestamp || b.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Security & Governance Audit Trail</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Total Entries: {auditLogs.length}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">{log.action}</td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">{log.targetId}</td>
                  <td className="py-3 px-4 text-slate-600">{log.performedBy}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && activeTab === 'student-profile' && (() => {
        const profile = selectedStudent.studentProfile || {};
        const closeProfile = () => {
          setSelectedStudent(null);
          setStudentResume({ url: '', loading: false, error: '' });
          setActiveTab('students');
        };
        return (
          <div className="space-y-4">
            <section aria-labelledby="student-profile-title" className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-amber-100 text-lg font-bold text-amber-800">{selectedStudent.photoUrl ? <img src={selectedStudent.photoUrl} alt="" className="h-full w-full object-cover" /> : (selectedStudent.name || selectedStudent.email || 'S').slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-700">Student profile</p><h2 id="student-profile-title" className="truncate text-xl font-bold text-slate-900">{selectedStudent.name || 'Student'}</h2><p className="truncate text-sm text-slate-500">{selectedStudent.email}</p></div>
                </div>
                <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={closeProfile} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><span aria-hidden="true">← </span>Back to students</button><button type="button" onClick={closeProfile} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50" aria-label="Close student profile">×</button></div>
              </header>
              <div className="grid gap-0 lg:grid-cols-[minmax(320px,.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-5 border-b border-slate-200 p-5 sm:p-7 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['College', profile.college?.name || 'Not mapped'],
                      ['Department', profile.department?.name || 'Not mapped'],
                      ['USN', profile.usn || '—'],
                      ['Graduation', profile.graduationYear || '—'],
                      ['CGPA', profile.cgpa != null ? Number(profile.cgpa).toFixed(2) : '—'],
                      ['Backlogs', profile.backlogs ?? '—'],
                      ['Current semester', profile.semester ?? '—'],
                      ['Account status', selectedStudent.isVerified ? 'Verified' : 'Pending'],
                    ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800" title={String(value)}>{value}</p></div>)}
                  </div>

                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.length ? profile.skills.map((item, index) => {
                        const skillName = typeof item === 'string' ? item : (item.skill?.name || item.name || 'Skill');
                        const skillLevel = item.level ? String(item.level).toLowerCase() : '';
                        return (
                          <span key={`${skillName}-${index}`} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {skillName}
                            {skillLevel && <span className="ml-1.5 text-slate-500">{skillLevel}</span>}
                          </span>
                        );
                      }) : <p className="text-sm text-slate-400">No skills added yet.</p>}
                    </div>
                  </section>

                  <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Certifications</h3>{profile.certifications?.length ? <ul className="space-y-2">{profile.certifications.map((item, index) => <li key={`${item.name}-${index}`} className="flex items-center gap-2 text-sm text-slate-700"><span className="grid h-6 w-6 place-items-center rounded-md bg-amber-50 text-[10px] font-bold text-amber-700">✓</span>{item.name}</li>)}</ul> : <p className="text-sm text-slate-400">No certifications added yet.</p>}</section>

                  <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Projects</h3>{profile.projects?.length ? <ul className="space-y-1.5">{profile.projects.map((item, index) => <li key={`${item.title}-${index}`} className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">{item.title}</li>)}</ul> : <p className="text-sm text-slate-400">No projects added yet.</p>}</section>

                  <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Links</h3><div className="flex flex-wrap gap-3 text-sm">{profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">GitHub ↗</a>}{profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">LinkedIn ↗</a>}{!profile.githubUrl && !profile.linkedinUrl && <p className="text-slate-400">No public links provided.</p>}</div></section>

                  <section><div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent applications</h3><span className="text-[10px] text-slate-400">Latest 10</span></div>{profile.applications?.length ? <div className="space-y-2">{profile.applications.map((application, index) => <div key={`${application.opportunity?.title}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"><div><p className="text-xs font-semibold text-slate-800">{application.opportunity?.title || 'Opportunity'}</p><p className="mt-0.5 text-[10px] text-slate-500">{application.opportunity?.company?.name || ''} · {application.opportunity?.type || ''}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{application.status.replaceAll('_', ' ')}</span></div>)}</div> : <p className="text-sm text-slate-400">No applications yet.</p>}</section>
                </div>

                <section className="flex min-h-[360px] flex-col p-4 sm:p-6 lg:min-h-[620px]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">Resume</h3><p className="mt-0.5 text-xs text-slate-500">Private preview available to administrators</p></div>{profile.resumeUrl && !studentResume.url && <button type="button" onClick={() => loadStudentResume(selectedStudent.id)} disabled={studentResume.loading} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{studentResume.loading ? 'Loading resume…' : 'Open resume'}</button>}</div>
                  {studentResume.error && <div role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{studentResume.error}</div>}
                  {studentResume.url ? <iframe title={`${selectedStudent.name || 'Student'} resume`} src={studentResume.url} className="min-h-[520px] w-full flex-1 rounded-xl border border-slate-200 bg-white" /> : studentResume.loading ? <div className="grid min-h-[300px] flex-1 place-items-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Loading the student resume…</div> : <div className="grid min-h-[300px] flex-1 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">{profile.resumeUrl ? <p className="text-sm text-slate-500">Select <strong>Open resume</strong> to view the PDF here.</p> : <p className="text-sm text-slate-500">This student has not uploaded a resume.</p>}</div>}
                </section>
              </div>
              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
                <span className="hidden text-xs text-slate-500 sm:inline">Finished reviewing this student?</span>
                <button type="button" onClick={closeProfile} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"><span aria-hidden="true">←</span> Back to students list</button>
              </footer>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
