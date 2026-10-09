import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingService } from '../../services/trainingService';
import { authService } from '../../services/authService';
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  Award,
  BookOpen,
  FileText,
  Edit3,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Send,
  X,
  Search,
  PlusCircle,
  Calendar
} from 'lucide-react';

const initialProgram = {
  title: '',
  domain: '',
  skillsCovered: '',
  mode: 'ONLINE',
  durationWeeks: 4,
  format: '',
  assessmentType: '',
  assignmentDetails: '',
  testInstructions: ''
};

export default function SkillProviderDashboard() {
  const currentUser = authService.getCurrentUser();
  const isProvider = currentUser?.role === 'SKILL_PROVIDER';

  const [form, setForm] = useState(initialProgram);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState('');

  // Selected Student for Detailed Evaluation & Grading Modal
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    testMarks: '',
    assignmentMarks: '',
    projectMarks: '',
    feedback: '',
    customCertificateCode: ''
  });

  // Edit Program Assignment Modal
  const [editingProgram, setEditingProgram] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    assignmentDetails: '',
    testInstructions: ''
  });

  // Assign Task to Single Student Modal
  const [selectedStudentForTask, setSelectedStudentForTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    customAssignmentTitle: '',
    customAssignmentDetails: '',
    customAssignmentDeadline: ''
  });

  // Filter & Search
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    try {
      const catalog = await trainingService.list();
      if (isProvider) {
        const providerData = await trainingService.providerEnrollments();
        const ownIds = new Set((providerData.programs || []).map((p) => p.id));
        setPrograms((catalog.programs || []).filter((p) => ownIds.has(p.id)));
        setEnrollments(providerData.enrollments || []);
      } else {
        setPrograms(catalog.programs || []);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load provider data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishProgram = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await trainingService.publish({
        ...form,
        durationWeeks: Number(form.durationWeeks),
        skillsCovered: form.skillsCovered.split(',').map((skill) => skill.trim()).filter(Boolean)
      });
      setMessage(result.message);
      setForm(initialProgram);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish program.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAssignments = async (e) => {
    e.preventDefault();
    if (!editingProgram) return;
    setActionBusy('updating-assignments');
    setError('');
    setMessage('');
    try {
      const res = await trainingService.updateAssignments(editingProgram.id, assignmentForm);
      setMessage(res.message);
      setEditingProgram(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update assignments.');
    } finally {
      setActionBusy('');
    }
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentForTask) return;
    setActionBusy(`task-${selectedStudentForTask.id}`);
    setError('');
    setMessage('');
    try {
      const res = await trainingService.assignStudentTask(selectedStudentForTask.programId, {
        studentUserId: selectedStudentForTask.user.id,
        customAssignmentTitle: taskForm.customAssignmentTitle,
        customAssignmentDetails: taskForm.customAssignmentDetails,
        customAssignmentDeadline: taskForm.customAssignmentDeadline
      });
      setMessage(res.message);
      setSelectedStudentForTask(null);
      setTaskForm({ customAssignmentTitle: '', customAssignmentDetails: '', customAssignmentDeadline: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign task to student.');
    } finally {
      setActionBusy('');
    }
  };

  const handleGrantPermission = async (programId, studentUserId) => {
    setActionBusy(`perm-${programId}-${studentUserId}`);
    setError('');
    setMessage('');
    try {
      const res = await trainingService.approvePermission(programId, studentUserId);
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to grant exam permission.');
    } finally {
      setActionBusy('');
    }
  };

  const openGradingModal = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setGradingForm({
      testMarks: enrollment.testMarks !== null && enrollment.testMarks !== undefined ? enrollment.testMarks : '',
      assignmentMarks: enrollment.assignmentMarks !== null && enrollment.assignmentMarks !== undefined ? enrollment.assignmentMarks : '',
      projectMarks: enrollment.projectMarks !== null && enrollment.projectMarks !== undefined ? enrollment.projectMarks : '',
      feedback: enrollment.feedback || '',
      customCertificateCode: enrollment.certificateCode || ''
    });
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setActionBusy(`grade-${selectedEnrollment.id}`);
    setError('');
    setMessage('');
    try {
      const res = await trainingService.gradeStudent(selectedEnrollment.programId, {
        studentUserId: selectedEnrollment.user.id,
        testMarks: gradingForm.testMarks !== '' ? Number(gradingForm.testMarks) : null,
        assignmentMarks: gradingForm.assignmentMarks !== '' ? Number(gradingForm.assignmentMarks) : null,
        projectMarks: gradingForm.projectMarks !== '' ? Number(gradingForm.projectMarks) : null,
        feedback: gradingForm.feedback,
        customCertificateCode: gradingForm.customCertificateCode
      });
      setMessage(res.message);
      setSelectedEnrollment(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student marks.');
    } finally {
      setActionBusy('');
    }
  };

  const filteredEnrollments = enrollments.filter((item) => {
    const nameMatch = (item.user?.name || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
      (item.user?.email || '').toLowerCase().includes(searchStudent.toLowerCase()) ||
      (item.programTitle || '').toLowerCase().includes(searchStudent.toLowerCase());

    if (statusFilter === 'ALL') return nameMatch;
    if (statusFilter === 'COMPLETED') return nameMatch && item.status === 'COMPLETED';
    if (statusFilter === 'AWAITING') return nameMatch && item.status === 'AWAITING_APPROVAL';
    if (statusFilter === 'APPROVED') return nameMatch && item.status === 'APPROVED_FOR_EXAM';
    if (statusFilter === 'IN_PROGRESS') return nameMatch && item.status === 'IN_PROGRESS';
    return nameMatch;
  });

  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;
  const pendingClearance = enrollments.filter((e) => e.status === 'AWAITING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              <ShieldCheck className="w-3.5 h-3.5" /> Learning Partner Hub
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            Skill Provider Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create Google-Form style quizzes, assign targeted student tasks, track progress, and grade certificates.
          </p>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold text-rose-700">Dismiss</button>
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-xs font-bold text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Published Programs', programs.length, 'bg-blue-50 text-blue-600', BookOpen],
          ['Total Student Enrollments', enrollments.length, 'bg-purple-50 text-purple-600', UserCheck],
          ['Pending Evaluation', pendingClearance, 'bg-amber-50 text-amber-600', Clock],
          ['Certified Graduates', completedCount, 'bg-emerald-50 text-emerald-600', Award]
        ].map(([label, value, colorClass, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Publish Program & Quiz Builder Launcher */}
      {isProvider && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Publish Program & Google Form Quiz Builder
              </h2>
              <p className="text-xs text-slate-500">Create skill programs and launch dedicated Google Form style quiz creation tool.</p>
            </div>
          </div>

          <form onSubmit={publishProgram} className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Program Title *
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. AWS Cloud Architecture Masterclass"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Domain *
              <input
                required
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                placeholder="Cloud Computing / DevOps"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 md:col-span-2">
              Skills Covered (comma separated) *
              <input
                required
                value={form.skillsCovered}
                onChange={(e) => setForm({ ...form, skillsCovered: e.target.value })}
                placeholder="AWS, Docker, Kubernetes, Terraform"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Delivery Mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option>ONLINE</option>
                <option>HYBRID</option>
                <option>OFFLINE</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Duration (weeks) *
              <input
                required
                type="number"
                min="1"
                max="104"
                value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Publishing Program...' : 'Publish Training Program'}
              </button>
            </div>
          </form>

          {/* List of Published Programs */}
          {programs.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Your Published Programs & Form Quiz Banks ({programs.length})</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {programs.map((prog) => {
                  const qCount = Array.isArray(prog.quizQuestions) ? prog.quizQuestions.length : 0;
                  return (
                    <div key={prog.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800">
                            {prog.domain}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">{prog.durationWeeks} Weeks</span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-slate-900">{prog.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(prog.skillsCovered || []).map((sk) => (
                            <span key={sk} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setEditingProgram(prog);
                            setAssignmentForm({
                              testInstructions: prog.testInstructions || '',
                              assignmentDetails: prog.assignmentDetails || ''
                            });
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Instructions
                        </button>

                        <Link
                          to={`/skill-provider/quiz-builder/${prog.id}`}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>Google Form Quiz Builder ({qCount} Qs)</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Edit General Instructions Modal */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Program Syllabus & General Instructions</h3>
                <p className="text-xs text-slate-500">{editingProgram.title}</p>
              </div>
              <button onClick={() => setEditingProgram(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignments} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Test / Exam General Rules
                <textarea
                  rows="3"
                  value={assignmentForm.testInstructions}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, testInstructions: e.target.value })}
                  placeholder="Enter test syllabus or guidelines..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                General Capstone Project Guidelines
                <textarea
                  rows="3"
                  value={assignmentForm.assignmentDetails}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentDetails: e.target.value })}
                  placeholder="Enter default project prompt or requirements..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={actionBusy === 'updating-assignments'}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Custom Task to Single Student Modal */}
      {selectedStudentForTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-purple-600">Personalized Assignment</span>
                <h3 className="font-bold text-slate-900 text-base">Assign Task to {selectedStudentForTask.user?.name}</h3>
                <p className="text-xs text-slate-500">{selectedStudentForTask.programTitle}</p>
              </div>
              <button onClick={() => setSelectedStudentForTask(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Task / Assignment Title *
                <input
                  required
                  type="text"
                  value={taskForm.customAssignmentTitle}
                  onChange={(e) => setTaskForm({ ...taskForm, customAssignmentTitle: e.target.value })}
                  placeholder="e.g. Individual Microservice API & Docker Refactor Task"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Detailed Instructions & Prompt
                <textarea
                  rows="4"
                  value={taskForm.customAssignmentDetails}
                  onChange={(e) => setTaskForm({ ...taskForm, customAssignmentDetails: e.target.value })}
                  placeholder="Specific requirements tailored for this student..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Submission Deadline
                <input
                  type="date"
                  value={taskForm.customAssignmentDeadline}
                  onChange={(e) => setTaskForm({ ...taskForm, customAssignmentDeadline: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={actionBusy === `task-${selectedStudentForTask.id}`}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Assign Task to Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Tracking & Evaluation Section */}
      {isProvider && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header & Filters */}
          <div className="border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> Student Progress, Individual Tasks & Marks
              </h2>
              <p className="text-xs text-slate-500">Track enrolled students, assign custom individual tasks, inspect submissions, and evaluate marks.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or program..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AWAITING">Pending Clearance</option>
                <option value="APPROVED">Cleared for Exam</option>
                <option value="COMPLETED">Completed / Graded</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredEnrollments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Assigned Individual Task</th>
                    <th className="px-5 py-3">Submissions</th>
                    <th className="px-5 py-3">Marks & Score</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{item.user?.name || 'Student Account'}</p>
                        <p className="text-[11px] text-slate-400">{item.user?.email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}</p>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {item.programTitle}
                      </td>

                      {/* Custom Assigned Task */}
                      <td className="px-5 py-3.5">
                        {item.customAssignmentTitle ? (
                          <div>
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block text-[11px]">
                              {item.customAssignmentTitle}
                            </span>
                            {item.customAssignmentDeadline && (
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Due: {new Date(item.customAssignmentDeadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStudentForTask(item);
                              setTaskForm({
                                customAssignmentTitle: '',
                                customAssignmentDetails: '',
                                customAssignmentDeadline: ''
                              });
                            }}
                            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Assign Custom Task
                          </button>
                        )}
                      </td>

                      {/* Submissions */}
                      <td className="px-5 py-3.5">
                        {item.projectUrl ? (
                          <a
                            href={item.projectUrl.startsWith('http') ? item.projectUrl : `https://${item.projectUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> {item.projectTitle || 'Project Repo'}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No project linked</span>
                        )}
                        {item.assignmentSubmission && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            <strong className="text-slate-700">Ans:</strong> {item.assignmentSubmission}
                          </p>
                        )}
                      </td>

                      {/* Marks & Score */}
                      <td className="px-5 py-3.5">
                        {item.status === 'COMPLETED' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Award className="w-3 h-3 text-emerald-600" /> {item.score}% Overall
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                              {item.testMarks !== null && <span>Test: <strong>{item.testMarks}</strong></span>}
                              {item.assignmentMarks !== null && <span>Assign: <strong>{item.assignmentMarks}</strong></span>}
                              {item.projectMarks !== null && <span>Proj: <strong>{item.projectMarks}</strong></span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Ungraded</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'APPROVED_FOR_EXAM'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'AWAITING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status === 'COMPLETED'
                            ? `Completed`
                            : item.status === 'APPROVED_FOR_EXAM'
                            ? 'Cleared for Exam'
                            : item.status === 'AWAITING_APPROVAL'
                            ? 'Pending Permission'
                            : 'In Progress'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {item.status !== 'APPROVED_FOR_EXAM' && item.status !== 'COMPLETED' && (
                          <button
                            disabled={actionBusy === `perm-${item.programId}-${item.user?.id}`}
                            onClick={() => handleGrantPermission(item.programId, item.user?.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            Grant Clearance
                          </button>
                        )}

                        <button
                          onClick={() => openGradingModal(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                        >
                          {item.status === 'COMPLETED' ? 'Edit Marks' : 'Evaluate & Grade'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No student records matched your current filter criteria.
            </div>
          )}
        </section>
      )}

      {/* Student Evaluation & Grading Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-600">Student Evaluation & Grading</span>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedEnrollment.user?.name}</h3>
                <p className="text-xs text-slate-500">{selectedEnrollment.programTitle}</p>
              </div>
              <button onClick={() => setSelectedEnrollment(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Inspection */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Submitted Artifacts</h4>
              <div>
                <span className="text-slate-500 font-medium">Project Title / Repo:</span>{' '}
                {selectedEnrollment.projectUrl ? (
                  <a
                    href={selectedEnrollment.projectUrl.startsWith('http') ? selectedEnrollment.projectUrl : `https://${selectedEnrollment.projectUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 underline"
                  >
                    {selectedEnrollment.projectTitle || 'Link to Submission'}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">None submitted</span>
                )}
              </div>

              {selectedEnrollment.assignmentSubmission && (
                <div>
                  <span className="text-slate-500 font-medium block">Assignment Response:</span>
                  <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {selectedEnrollment.assignmentSubmission}
                  </div>
                </div>
              )}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Test Marks (0-100)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradingForm.testMarks}
                    onChange={(e) => setGradingForm({ ...gradingForm, testMarks: e.target.value })}
                    placeholder="85"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Assignment Marks
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradingForm.assignmentMarks}
                    onChange={(e) => setGradingForm({ ...gradingForm, assignmentMarks: e.target.value })}
                    placeholder="90"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Project Marks
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradingForm.projectMarks}
                    onChange={(e) => setGradingForm({ ...gradingForm, projectMarks: e.target.value })}
                    placeholder="95"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Evaluation Notes / Provider Feedback
                <textarea
                  rows="3"
                  value={gradingForm.feedback}
                  onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                  placeholder="Provide feedback on project architecture, code quality, and test execution..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Custom Certificate Credential ID (Optional)
                <input
                  type="text"
                  value={gradingForm.customCertificateCode}
                  onChange={(e) => setGradingForm({ ...gradingForm, customCertificateCode: e.target.value })}
                  placeholder="Auto-generated if left blank (e.g. SKILL-CERT-89A23)"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEnrollment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={actionBusy === `grade-${selectedEnrollment.id}`}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" /> Save Marks & Issue Official Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
