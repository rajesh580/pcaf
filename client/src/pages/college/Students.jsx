import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Award,
  FileText,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function CollegeStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');

  // Selected Student Profile State for Detail Page / Inspector View
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState('');
  const [loadingResume, setLoadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/college/students');
      setStudents(data.students || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch enrolled students roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const loadStudentResume = async (studentUserId) => {
    setLoadingResume(true);
    setResumeError('');
    setResumePreviewUrl('');
    try {
      const response = await api.get(`/admin/students/${studentUserId}/resume`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setResumePreviewUrl(url);
    } catch (err) {
      setResumeError('Resume document not available or missing.');
    } finally {
      setLoadingResume(false);
    }
  };

  const openStudentDetail = (userStudent) => {
    setSelectedStudent(userStudent);
    if (userStudent?.studentProfile?.resumeUrl) {
      loadStudentResume(userStudent.id);
    } else {
      setResumePreviewUrl('');
      setResumeError('');
    }
  };

  // Filtered Roster computation
  const filteredStudents = students.filter((s) => {
    const profile = s.studentProfile || {};
    const nameStr = (s.name || '').toLowerCase();
    const emailStr = (s.email || '').toLowerCase();
    const usnStr = (profile.usn || '').toLowerCase();
    const deptStr = (profile.department?.name || profile.department?.code || '').toLowerCase();

    const matchesSearch =
      !searchTerm ||
      nameStr.includes(searchTerm.toLowerCase()) ||
      emailStr.includes(searchTerm.toLowerCase()) ||
      usnStr.includes(searchTerm.toLowerCase()) ||
      deptStr.includes(searchTerm.toLowerCase());

    const matchesDept = !deptFilter || deptStr.includes(deptFilter.toLowerCase());
    const matchesCgpa = !minCgpa || (profile.cgpa && profile.cgpa >= parseFloat(minCgpa));
    const matchesBacklogs = maxBacklogs === '' || (profile.backlogs !== undefined && profile.backlogs <= parseInt(maxBacklogs, 10));

    return matchesSearch && matchesDept && matchesCgpa && matchesBacklogs;
  });

  const uniqueDepartments = Array.from(
    new Set(
      students
        .map((s) => s.studentProfile?.department?.code || s.studentProfile?.department?.name)
        .filter(Boolean)
    )
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" /> Enrolled Student Roster
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Institutional Student Profiles</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Inspect enrolled student accounts, academic records, verified skill profiles, and recruitment application histories across departments.
          </p>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-display">{students.length} Students</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          ⚠️ {error}
        </div>
      )}

      {/* Detail Page View for Selected Student */}
      {selectedStudent ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setSelectedStudent(null);
              if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
              setResumePreviewUrl('');
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Enrolled Students Directory</span>
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
            {/* Student Profile Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold font-display shadow-md">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    (selectedStudent.name || selectedStudent.email || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      {selectedStudent.name || 'Student Candidate'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Enrolled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedStudent.email} · USN: <strong className="font-mono text-slate-700 dark:text-slate-200">{selectedStudent.studentProfile?.usn || '—'}</strong>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {selectedStudent.studentProfile?.college?.name} · {selectedStudent.studentProfile?.department?.name || selectedStudent.studentProfile?.department?.code || 'Department'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedStudent.studentProfile?.linkedinUrl && (
                  <a
                    href={selectedStudent.studentProfile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedStudent.studentProfile?.githubUrl && (
                  <a
                    href={selectedStudent.studentProfile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Academic KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative CGPA</span>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-display">
                  {selectedStudent.studentProfile?.cgpa ? selectedStudent.studentProfile.cgpa.toFixed(2) : '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Backlog Count</span>
                <p className={`text-2xl font-bold font-display ${selectedStudent.studentProfile?.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedStudent.studentProfile?.backlogs ?? 0}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Sem {selectedStudent.studentProfile?.semester || '—'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graduation Batch</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Class of {selectedStudent.studentProfile?.graduationYear || '—'}
                </p>
              </div>
            </div>

            {/* Profile Grid: Skills, Certifications & Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verified Skills */}
              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Technical Skills
                </h3>
                {selectedStudent.studentProfile?.skills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.studentProfile.skills.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                      >
                        <span className="font-semibold">{item.skill?.name || item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.level?.toLowerCase() || 'intermediate'})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills cataloged on profile.</p>
                )}
              </div>

              {/* Certifications & Projects */}
              <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-500" /> Certifications
                  </h3>
                  {selectedStudent.studentProfile?.certifications?.length ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {selectedStudent.studentProfile.certifications.map((c, idx) => (
                        <li key={idx}>{c.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No certifications listed.</p>
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Academic Projects
                  </h3>
                  {selectedStudent.studentProfile?.projects?.length ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {selectedStudent.studentProfile.projects.map((p, idx) => (
                        <li key={idx}>{p.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No projects listed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Applications History Table */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" /> Placement & Internship Application Records
              </h3>

              {selectedStudent.studentProfile?.applications?.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Opportunity</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Match Score</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedStudent.studentProfile.applications.map((app, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {app.opportunity?.title || 'Opportunity'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {app.opportunity?.company?.name || 'Company'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {app.opportunity?.type || 'PLACEMENT'}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600">
                            {app.matchScore != null ? `${app.matchScore}%` : '—'}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {(app.status || 'APPLIED').replaceAll('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No job or internship applications submitted yet.</p>
              )}
            </div>

            {/* Resume Preview */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Candidate Resume Document
              </h3>
              {loadingResume ? (
                <p className="text-xs text-slate-400 italic">Loading resume document...</p>
              ) : resumeError ? (
                <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800">
                  {resumeError}
                </p>
              ) : resumePreviewUrl ? (
                <iframe
                  title="Candidate Resume Preview"
                  src={resumePreviewUrl}
                  className="w-full h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              ) : (
                <p className="text-xs text-slate-400 italic">No resume uploaded by candidate.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Enrolled Students Roster Directory */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Search Student Name / USN / Email
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Filter by Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Minimum CGPA
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Max Backlogs Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white font-display text-sm">
                Enrolled Candidates ({filteredStudents.length})
              </h3>
              <span className="text-xs text-slate-400">Click any row to inspect complete student profile</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">Loading student roster...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No enrolled students match your search filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">USN</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">CGPA</th>
                      <th className="py-3 px-4">Backlogs</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((student) => {
                      const profile = student.studentProfile || {};
                      return (
                        <tr
                          key={student.id}
                          onClick={() => openStudentDetail(student)}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 dark:text-white">{student.name || 'Candidate'}</p>
                            <p className="text-[11px] text-slate-400">{student.email}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {profile.usn || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {profile.department?.name || profile.department?.code || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400 font-display">
                            {profile.cgpa ? profile.cgpa.toFixed(2) : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold ${profile.backlogs > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                              {profile.backlogs ?? 0}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {profile.graduationYear || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStudentDetail(student);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
