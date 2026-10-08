import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const formatRole = (role = '') => role.toLowerCase().split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');

export default function AdminCollegeDetail() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let mounted = true;
    const loadCollege = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/admin/colleges/${collegeId}`);
        if (mounted) setCollege(data.college);
      } catch (requestError) {
        if (mounted) setError(requestError.response?.data?.error || 'Failed to load the college portal.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCollege();
    return () => { mounted = false; };
  }, [collegeId]);

  const groups = useMemo(() => {
    const people = college?.people || [];
    return {
      people,
      administrators: people.filter((user) => ['COLLEGE_ADMIN', 'DEPARTMENT_ADMIN'].includes(user.role)),
      faculty: people.filter((user) => ['FACULTY_COORDINATOR', 'MENTOR'].includes(user.role)),
      students: people.filter((user) => user.role === 'STUDENT'),
    };
  }, [college]);

  if (loading) {
    return <div className="py-16 text-center text-sm font-medium text-slate-500">Loading college portal...</div>;
  }

  if (!college) {
    return (
      <div className="space-y-4 py-8">
        <button type="button" onClick={() => navigate('/dashboard/admin')} className="text-sm font-semibold text-blue-600 hover:underline">Back to platform administration</button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error || 'College not found.'}</div>
      </div>
    );
  }

  const stats = college.stats || {};
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'All users', count: groups.people.length },
    { id: 'administrators', label: 'Administrators', count: groups.administrators.length },
    { id: 'faculty', label: 'Faculty', count: groups.faculty.length },
    { id: 'students', label: 'Students', count: stats.totalStudents || 0 },
    { id: 'departments', label: 'Departments', count: stats.totalDepartments || 0 },
  ];
  const userTabs = ['people', 'administrators', 'faculty'];
  const visiblePeople = groups[activeTab] || groups.people;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <button type="button" onClick={() => navigate('/dashboard/admin')} className="mb-3 text-xs font-semibold text-blue-600 hover:underline">
          Back to platform administration
        </button>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">College portal</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{college.name}</h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{college.code}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{college.university || 'Institutional profile'}{college.accreditation ? ` · ${college.accreditation}` : ''}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="block text-xs font-medium uppercase tracking-wide text-slate-400">Users</span><span className="font-semibold text-slate-800">{stats.totalUsers || 0}</span></div>
            <div><span className="block text-xs font-medium uppercase tracking-wide text-slate-400">Students</span><span className="font-semibold text-slate-800">{stats.totalStudents || 0}</span></div>
          </div>
        </div>
      </header>

      <nav aria-label="College portal sections" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}{typeof tab.count === 'number' ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>
      </nav>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Overall users', stats.totalUsers || 0, 'Every account linked to this college'],
          ['Active accounts', stats.activeUsers || 0, 'Accounts currently enabled'],
          ['Student records', stats.totalStudents || 0, 'Registered candidates'],
          ['Placed students', stats.placedStudents || 0, `${stats.totalApplications || 0} total applications`],
        ].map(([label, value, caption]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{caption}</p>
          </div>
        ))}
      </section>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Department distribution</h2>
                <p className="mt-1 text-sm text-slate-500">Users and students assigned to each department.</p>
              </div>
              <button type="button" onClick={() => setActiveTab('departments')} className="text-xs font-semibold text-blue-600 hover:underline">View departments</button>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {college.departments.length ? college.departments.map((department) => (
                <div key={department.id} className="flex items-center justify-between gap-4 py-3">
                  <div><p className="font-semibold text-slate-800">{department.name}</p><p className="text-xs text-slate-500">{department.code}</p></div>
                  <div className="flex gap-5 text-right text-xs"><span><strong className="block text-sm text-slate-800">{department.studentCount}</strong>Students</span><span><strong className="block text-sm text-slate-800">{department.userCount}</strong>Staff</span></div>
                </div>
              )) : <p className="py-8 text-center text-sm text-slate-500">No departments have been added yet.</p>}
            </div>
          </section>
          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Institution details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">University</dt><dd className="mt-1 text-slate-700">{college.university || 'Not recorded'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Accreditation</dt><dd className="mt-1 text-slate-700">{college.accreditation || 'Not recorded'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Address</dt><dd className="mt-1 text-slate-700">{college.address || 'Not recorded'}</dd></div>
              {college.website && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Website</dt><dd className="mt-1 break-all"><a className="font-medium text-blue-600 hover:underline" href={college.website} target="_blank" rel="noreferrer">{college.website}</a></dd></div>}
            </dl>
          </aside>
        </div>
      )}

      {userTabs.includes(activeTab) && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div><h2 className="font-bold text-slate-900">{activeTab === 'people' ? 'All linked users' : activeTab === 'administrators' ? 'College administrators' : 'Faculty and coordinators'}</h2><p className="mt-1 text-xs text-slate-500">Accounts assigned through the college, a department, or a student profile.</p></div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{visiblePeople.length} accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Joined</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePeople.length ? visiblePeople.map((person) => <tr key={person.id}><td className="px-5 py-3 font-semibold text-slate-800">{person.name || '—'}</td><td className="px-5 py-3 text-slate-600">{person.email}</td><td className="px-5 py-3"><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{formatRole(person.role)}</span></td><td className="px-5 py-3 text-slate-600">{person.department?.code || 'College-wide'}</td><td className="px-5 py-3"><span className={`text-xs font-semibold ${person.isActive !== false ? 'text-emerald-700' : 'text-rose-700'}`}>{person.isActive !== false ? 'Active' : 'Inactive'}</span></td><td className="px-5 py-3 text-xs text-slate-500">{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '—'}</td></tr>) : <tr><td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">No users in this group yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'students' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold text-slate-900">Student records</h2><p className="mt-1 text-xs text-slate-500">Candidate profiles registered under {college.name}.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">USN</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Semester</th><th className="px-5 py-3">CGPA</th><th className="px-5 py-3">Applications</th></tr></thead><tbody className="divide-y divide-slate-100">{college.students.length ? college.students.map((student) => <tr key={student.id}><td className="px-5 py-3"><p className="font-semibold text-slate-800">{student.name}</p><p className="text-xs text-slate-500">{student.email}</p></td><td className="px-5 py-3 font-mono text-xs text-slate-600">{student.usn}</td><td className="px-5 py-3 text-slate-600">{student.department?.code || '—'}</td><td className="px-5 py-3 text-slate-600">{student.semester}</td><td className="px-5 py-3 font-semibold text-slate-800">{Number(student.cgpa || 0).toFixed(2)}</td><td className="px-5 py-3 text-blue-600">{student.applications}</td></tr>) : <tr><td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">No students registered under this college yet.</td></tr>}</tbody></table></div>
        </section>
      )}

      {activeTab === 'departments' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold text-slate-900">Departments</h2><p className="mt-1 text-xs text-slate-500">Academic units registered for this institution.</p></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Department</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Staff users</th><th className="px-5 py-3">Students</th></tr></thead><tbody className="divide-y divide-slate-100">{college.departments.length ? college.departments.map((department) => <tr key={department.id}><td className="px-5 py-3 font-semibold text-slate-800">{department.name}</td><td className="px-5 py-3 font-mono text-xs text-slate-600">{department.code}</td><td className="px-5 py-3 text-slate-600">{department.userCount}</td><td className="px-5 py-3 font-semibold text-blue-600">{department.studentCount}</td></tr>) : <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-slate-500">No departments registered yet.</td></tr>}</tbody></table></div>
        </section>
      )}
    </div>
  );
}
