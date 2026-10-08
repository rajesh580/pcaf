import React, { useEffect, useState } from 'react';
import { collegeService } from '../../services/collegeService';
import { authService } from '../../services/authService';
import api from '../../services/api';
import {
  Building,
  UserCheck,
  Plus,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  Hash,
  ArrowRight,
  School
} from 'lucide-react';

export default function CollegeDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deptAdmins, setDeptAdmins] = useState([]);
  const [newDept, setNewDept] = useState({ code: '', name: '', hod: '' });
  const [newDeptAdmin, setNewDeptAdmin] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();
  const canManage = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'COLLEGE_ADMIN'].includes(currentUser?.role);

  useEffect(() => {
    loadDepartments();
    if (canManage) {
      loadDeptAdmins();
    }
  }, [canManage]);

  const loadDepartments = () => {
    collegeService.getDepartments()
      .then((res) => setDepartments(res.departments || []))
      .finally(() => setLoading(false));
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
      setMsg(`Department ${newDept.code} created successfully!`);
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <School className="w-3.5 h-3.5" /> Department Governance
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {canManage ? 'Academic Departments & Administrator Roster' : 'Academic Departments'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canManage
              ? 'Manage institutional branch structures, allocate department administrators, and monitor student counts'
              : 'Overview of academic departments and student enrollment'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Branches</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-display">{departments.length}</span>
          </div>
          {canManage && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dept Admins</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">{deptAdmins.length}</span>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold p-4 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {canManage && (
        <>
          {/* 1. Provision Department Admin Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Provision Department Administrator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grant department administrative access to Heads of Department (HOD) or branch placement coordinators
              </p>
            </div>

            <form onSubmit={handleCreateDeptAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Admin Full Name
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={newDeptAdmin.name}
                      onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, name: e.target.value })}
                      className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                      placeholder="Dr. K. Anita"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={newDeptAdmin.email}
                      onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, email: e.target.value })}
                      className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                      placeholder="hod.cse@college.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newDeptAdmin.password}
                      onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, password: e.target.value })}
                      className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={newDeptAdmin.departmentId}
                      onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, departmentId: e.target.value })}
                      className="pl-10 pr-3 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Choose Branch --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Provision Department Admin</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Department Admins Table */}
          {deptAdmins.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Active Department Administrators ({deptAdmins.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-6 font-bold">Admin Name</th>
                      <th className="py-3.5 px-6 font-bold">Email</th>
                      <th className="py-3.5 px-6 font-bold">Assigned Department</th>
                      <th className="py-3.5 px-6 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deptAdmins.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">{u.name || '—'}</td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">
                          {u.departmentId || u.department?.code || '—'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${u.isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {u.isVerified ? '✓ Active' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Add Department Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Add New Academic Department
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Define new branch codes and head of department assignments</p>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                    placeholder="e.g. AI-DS, CSE"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Full Department Name</label>
                  <input
                    type="text"
                    required
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                    placeholder="e.g. Artificial Intelligence and Data Science"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">HOD Name</label>
                  <input
                    type="text"
                    value={newDept.hod}
                    onChange={(e) => setNewDept({ ...newDept, hod: e.target.value })}
                    className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                    placeholder="Dr. Rajesh Sharma"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Department</span>
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Departments Overview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Academic Department Master List ({departments.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6 font-bold">Branch Code</th>
                <th className="py-3.5 px-6 font-bold">Department Name</th>
                <th className="py-3.5 px-6 font-bold">HOD Name</th>
                <th className="py-3.5 px-6 font-bold">Students Enrolled</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                {canManage && <th className="py-3.5 px-6 font-bold text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-8 text-center text-slate-400">
                    No departments recorded in institution master database.
                  </td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{d.code}</td>
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">{d.name}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{d.hod || 'Unassigned'}</td>
                    <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-sm">{d.studentCount || 0}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                        d.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {d.status === 'ACTIVE' ? '✓ ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(d.id, d.status)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
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
    </div>
  );
}
