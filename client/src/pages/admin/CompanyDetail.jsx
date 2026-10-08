import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminCompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', website: '', status: 'APPROVED' });
  const [savingEdit, setSavingEdit] = useState(false);

  // New Recruiter Provisioning form
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'COMPANY_RECRUITER'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/companies/${companyId}`);
      const comp = res.data.company;
      setCompany(comp);
      setEditForm({
        name: comp.name || '',
        website: comp.website || '',
        status: comp.status || 'APPROVED'
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to load company dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  const handleSaveCompanyDetails = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setMsg('');
    setErrorMsg('');
    try {
      await api.put(`/admin/companies/${companyId}`, editForm);
      setMsg('Company details updated successfully!');
      fetchCompanyDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateCompanyUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setMsg('');
    setErrorMsg('');
    try {
      await api.post('/admin/users', {
        ...newUserForm,
        companyId: companyId
      });
      setMsg(`User ${newUserForm.email} provisioned for ${company.name}!`);
      setNewUserForm({ name: '', email: '', password: '', role: 'COMPANY_RECRUITER' });
      fetchCompanyDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to remove user ${email}?`)) return;
    setMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setMsg(`User ${email} removed.`);
      fetchCompanyDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading company dashboard & associated records...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-4 p-6">
        <button onClick={() => navigate('/dashboard/admin')} className="text-xs font-semibold text-blue-600 hover:underline">
          ← Back to Admin Dashboard
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {errorMsg || 'Company not found.'}
        </div>
      </div>
    );
  }

  const stats = company.stats || {};
  const recruiters = company.recruiters || [];
  const opportunities = company.opportunities || [];
  const allApplications = opportunities.flatMap((o) =>
    (o.applications || []).map((a) => ({ ...a, opportunityTitle: o.title, opportunityType: o.type }))
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/dashboard/admin')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center space-x-1 mb-2"
          >
            <span>← Back to Platform Super Administration</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                company.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : company.status === 'REJECTED'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {company.status ? company.status.replaceAll('_', ' ') : 'APPROVED'}
            </span>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline font-medium mt-1 inline-block"
            >
              🌐 {company.website}
            </a>
          )}
        </div>

        <div className="flex gap-2">
          {['users', 'opportunities', 'applications', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'users'
                ? `👥 Users (${recruiters.length})`
                : tab === 'opportunities'
                ? `💼 Opportunities (${opportunities.length})`
                : tab === 'applications'
                ? `📄 Applications (${allApplications.length})`
                : '⚙️ Settings'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Linked Users</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalRecruiters || recruiters.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recruiters & Company Admins</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Opportunities Posted</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalOpportunities || opportunities.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Jobs & Internship roles</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Applications</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalApplications || allApplications.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Student submissions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Selected / Hired</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.selectedApplications || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Joined & Placed candidates</p>
        </div>
      </div>

      {/* TAB 1: USERS & PROVISIONING */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Add User Form for this Company */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Provision New User for {company.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add recruiters or company administrators linked directly to {company.name}
            </p>
            <form onSubmit={handleCreateCompanyUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anish Sharma"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="recruiter@company.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 font-medium"
                >
                  <option value="COMPANY_RECRUITER">COMPANY_RECRUITER</option>
                  <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                </select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {creatingUser ? 'Provisioning...' : `Add User to ${company.name}`}
                </button>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">All Associated Users & Recruiters</h2>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                Total: {recruiters.length}
              </span>
            </div>

            {recruiters.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No users provisioned for {company.name} yet. Use the form above to add one.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recruiters.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">{u.name || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-semibold text-xs">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
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

      {/* TAB 2: OPPORTUNITIES */}
      {activeTab === 'opportunities' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Company Postings ({opportunities.length})</h2>
          </div>
          {opportunities.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No job or internship opportunities posted by {company.name} yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Opportunity Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Applications</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{opp.title}</td>
                    <td className="py-3 px-4 text-slate-600">{opp.type}</td>
                    <td className="py-3 px-4 font-medium text-blue-600">
                      {(opp.applications || []).length} applicants
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold text-xs">
                        {opp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Student Applications Pipeline ({allApplications.length})</h2>
          </div>
          {allApplications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No student applications submitted for {company.name} postings yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">College / Dept</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {app.student?.name || '—'}
                      <div className="text-xs text-slate-400 font-normal">USN: {app.student?.usn || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {app.student?.college?.name}
                      <div>{app.student?.department?.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {app.opportunityTitle}
                      <div className="text-xs text-slate-400 font-normal">{app.opportunityType}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-indigo-600">
                      {app.matchScore || 0}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs">
                        {(app.status || 'APPLIED').replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & EDIT */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl space-y-4">
          <h2 className="font-bold text-slate-800 text-base">Edit Company Profile</h2>
          <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Website URL</label>
              <input
                type="text"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                placeholder="https://company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Verification Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium"
              >
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                <option value="REJECTED">REJECTED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={savingEdit}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
