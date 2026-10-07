import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';
import { authService } from '../../services/authService';
import api from '../../services/api';

export default function CollegeDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deptAdmins, setDeptAdmins] = useState([]);
  const [newDept, setNewDept] = useState({ code: '', name: '', hod: '' });
  const [newDeptAdmin, setNewDeptAdmin] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = authService.getCurrentUser();
  const canManage = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'COLLEGE_ADMIN'].includes(currentUser?.role);

  useEffect(() => {
    loadDepartments();
    if (canManage) {
      loadDeptAdmins();
    }
  }, [canManage]);

  const loadDepartments = () => {
    collegeService.getDepartments().then((res) => setDepartments(res.departments || []));
  };

  const loadDeptAdmins = () => {
    api.get('/admin/users')
      .then((res) => {
        const list = (res.data.users || []).filter((u) => u.role === 'DEPARTMENT_ADMIN');
        setDeptAdmins(list);
      })
      .catch(() => null);
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDept.code || !newDept.name) return;
    try {
      await collegeService.createDepartment(newDept);
      setMsg(`Department ${newDept.code} created in master data!`);
      setNewDept({ code: '', name: '', hod: '' });
      loadDepartments();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleCreateDeptAdmin = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/admin/users', {
        ...newDeptAdmin,
        role: 'DEPARTMENT_ADMIN'
      });
      setMsg(res.data.message || 'Department Admin provisioned successfully!');
      setNewDeptAdmin({ name: '', email: '', password: '', departmentId: '' });
      loadDeptAdmins();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const next = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await collegeService.toggleDepartmentStatus(id, next);
      loadDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {canManage ? 'Department & Department Admin Management' : 'Academic Departments'}
        </h1>
        <p className="text-sm text-slate-500">
          {canManage
            ? 'Configurable department management, branch status, and Department Admin provisioning'
            : 'Overview of academic departments and student enrollment'}
        </p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">✅ {msg}</div>}
      {errorMsg && <div className="bg-rose-50 text-rose-800 text-sm p-3.5 rounded-lg border border-rose-200">⚠️ {errorMsg}</div>}

      {canManage && (
        <>
          {/* Provision Department Admin */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Provision Department Administrator</h3>
            <p className="text-xs text-slate-500 mb-4">Grant department administrative access to HODs or branch coordinators</p>
            <form onSubmit={handleCreateDeptAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={newDeptAdmin.name}
                  onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Dr. K. Anita"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newDeptAdmin.email}
                  onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="hod.cse@college.edu"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newDeptAdmin.password}
                  onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Department</label>
                <select
                  required
                  value={newDeptAdmin.departmentId}
                  onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                >
                  <option value="">-- Choose Branch --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition md:col-span-4 shadow-sm"
              >
                + Create Department Admin
              </button>
            </form>
          </div>

          {/* Active Department Admins Table */}
          {deptAdmins.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-3 border-b border-slate-200 font-bold text-sm text-slate-900 bg-slate-50">
                Active Department Administrators
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Branch / Dept</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptAdmins.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4 font-semibold text-slate-800">{u.name || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 text-xs font-mono text-blue-600">{u.departmentId || u.department?.code || '—'}</td>
                      <td className="py-3 px-4 text-xs">{u.isVerified ? '✅ Active' : '⏳ Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Department Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Add New Academic Department</h3>
            <form onSubmit={handleCreateDept} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Branch Code</label>
                <input
                  type="text"
                  required
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. AI-DS, CSBS, ROBOTICS"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Department Name</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Artificial Intelligence and Data Science"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={newDept.hod}
                  onChange={(e) => setNewDept({ ...newDept, hod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Dr. Rajesh Sharma"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition md:col-span-4"
              >
                Create Department
              </button>
            </form>
          </div>
        </>
      )}

      {/* Departments Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-4">HOD</th>
              <th className="py-3 px-4">Students Enrolled</th>
              <th className="py-3 px-4">Status</th>
              {canManage && <th className="py-3 px-4">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="py-8 text-center text-slate-400">
                  No departments recorded.
                </td>
              </tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 px-4 font-bold text-slate-900">{d.code}</td>
                  <td className="py-3 px-4 text-slate-700">{d.name}</td>
                  <td className="py-3 px-4 text-slate-600">{d.hod}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600">{d.studentCount || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(d.id, d.status)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        {d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
