import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  
  // Forms
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    collegeId: '',
    departmentId: ''
  });
  const [newCollegeForm, setNewCollegeForm] = useState({ name: '', code: '' });
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', website: '' });
  const [notifForm, setNotifForm] = useState({ title: '', message: '', targetAudience: 'ALL' });

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [dashRes, usersRes, studentsRes, clgRes, compRes, auditRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/students'),
        api.get('/admin/colleges'),
        api.get('/admin/companies'),
        api.get('/admin/audit-logs')
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
    } catch (err) {
      console.error('loadData error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/admin/users', newUserForm);
      setMsg(res.data.message || 'User created successfully!');
      setNewUserForm({ name: '', email: '', password: '', role: 'STUDENT', collegeId: '', departmentId: '' });
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
    try {
      await api.post('/admin/colleges', newCollegeForm);
      setMsg(`College ${newCollegeForm.name} registered.`);
      setNewCollegeForm({ name: '', code: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
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

  // 5. Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications', notifForm);
      setMsg('Broadcast notification sent successfully!');
      setNotifForm({ title: '', message: '', targetAudience: 'ALL' });
    } catch (err) {
      setErrorMsg('Broadcast failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Super Administration</h1>
          <p className="text-sm text-slate-500">Live PostgreSQL analytics, user provisioning, student records, and removal controls</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['users', 'students', 'overview', 'colleges', 'companies', 'broadcast', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'users' ? '👥 Users' : tab === 'students' ? '🎓 Students' : tab}
            </button>
          ))}
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
                  <input
                    type="text"
                    placeholder="e.g. Infosys, TCS, Global Tech Corp"
                    value={newUserForm.companyName || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
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
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.name || '—'}</td>
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
              <div className="text-2xl font-bold text-indigo-600 mt-1">{kpis.totalCompanies || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Colleges Management & Removal */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-lg">
            <h3 className="font-semibold text-slate-800 mb-3">Add Approved College</h3>
            <form onSubmit={handleAddCollege} className="space-y-3">
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
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Add College
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
                      <td className="py-3 px-4 font-medium text-slate-800">{clg.name}</td>
                      <td className="py-3 px-4 text-slate-600">{clg.code}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-600">{clg.status}</td>
                      <td className="py-3 px-4 text-right">
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
                  {companies.map((comp) => (
                    <tr key={comp.id}>
                      <td className="py-3 px-4 font-medium text-slate-800">{comp.name}</td>
                      <td className="py-3 px-4 text-blue-600 text-xs underline">
                        <a href={comp.website} target="_blank" rel="noreferrer">{comp.website || '—'}</a>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-600">{comp.status}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCompany(comp.id, comp.name)}
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

      {/* Tab: Broadcast Form */}
      {activeTab === 'broadcast' && (
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition"
            >
              Broadcast Notification
            </button>
          </form>
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
    </div>
  );
}
