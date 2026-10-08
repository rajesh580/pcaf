import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import {
  User,
  GraduationCap,
  FolderGit2,
  Award,
  Sparkles,
  CheckCircle2,
  Plus,
  Code,
  BookOpen,
  Layers,
  School
} from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('academic');

  const [academic, setAcademic] = useState({
    degree: '',
    branch: '',
    semester: '',
    cgpa: '',
    tenthPercentage: '',
    twelfthOrDiplomaPercentage: '',
    backlogs: ''
  });

  const [project, setProject] = useState({ title: '', techStack: '', description: '' });
  const [cert, setCert] = useState({ name: '', issuer: '', issueDate: '' });

  const loadProfile = () => {
    studentService.getProfile()
      .then((res) => {
        if (res.student) {
          setProfile(res.student);
          const ac = res.student.academicProfile || {};
          setAcademic({
            degree: ac.degree || '',
            branch: ac.branch || res.student.department || '',
            semester: res.student.semester || '',
            cgpa: res.student.cgpa || '',
            tenthPercentage: ac.tenthPercentage || '',
            twelfthOrDiplomaPercentage: ac.twelfthOrDiplomaPercentage || '',
            backlogs: res.student.backlogs !== undefined ? res.student.backlogs : ''
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateAcademic = async (e) => {
    e.preventDefault();
    try {
      await studentService.updateAcademicProfile(academic);
      setMsg('Academic profile saved successfully!');
      setTimeout(() => setMsg(''), 3000);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!project.title) return;
    try {
      await studentService.addProject(project);
      setMsg(`Project "${project.title}" saved!`);
      setProject({ title: '', techStack: '', description: '' });
      setTimeout(() => setMsg(''), 3000);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    if (!cert.name) return;
    try {
      await studentService.addCertification(cert);
      setMsg(`Certification "${cert.name}" saved!`);
      setCert({ name: '', issuer: '', issueDate: '' });
      setTimeout(() => setMsg(''), 3000);
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading student profile details...</p>
      </div>
    );
  }

  const projects = profile?.academicProfile?.academicProjects || [];
  const certs = profile?.academicProfile?.certifications || [];
  const skills = profile?.skills || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <User className="w-3.5 h-3.5" /> Student Persona
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {profile?.name || 'Student Profile'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {profile?.college ? `${profile.college} • ${profile.department || 'Student'}` : 'Manage academic scores, projects, certifications, and skills'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1">
          {[
            { id: 'academic', label: 'Academic Scores', icon: GraduationCap },
            { id: 'projects', label: 'Projects', icon: FolderGit2 },
            { id: 'certifications', label: 'Certifications', icon: Award },
            { id: 'skills', label: 'Skills Roster', icon: Sparkles },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Tab: Academic Profile */}
      {activeTab === 'academic' && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Academic Record & CGPA Metrics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These verified metrics are evaluated by corporate recruiters during internship & job cutoffs
            </p>
          </div>

          <form onSubmit={handleUpdateAcademic} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Degree Program
              </label>
              <input
                type="text"
                placeholder="e.g. B.E. / B.Tech"
                value={academic.degree}
                onChange={(e) => setAcademic({ ...academic, degree: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Branch / Department
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={academic.branch}
                onChange={(e) => setAcademic({ ...academic, branch: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Current Semester
              </label>
              <input
                type="number"
                placeholder="e.g. 6"
                value={academic.semester}
                onChange={(e) => setAcademic({ ...academic, semester: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Current CGPA
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 8.4"
                value={academic.cgpa}
                onChange={(e) => setAcademic({ ...academic, cgpa: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                10th Grade Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 91.5"
                value={academic.tenthPercentage}
                onChange={(e) => setAcademic({ ...academic, tenthPercentage: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                12th / Diploma Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 88.0"
                value={academic.twelfthOrDiplomaPercentage}
                onChange={(e) => setAcademic({ ...academic, twelfthOrDiplomaPercentage: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Active Backlogs
              </label>
              <input
                type="number"
                placeholder="0"
                value={academic.backlogs}
                onChange={(e) => setAcademic({ ...academic, backlogs: e.target.value })}
                className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Academic Information</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-600" />
                Add Academic or Personal Project
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Projects showcase your hands-on engineering, software architecture, and problem-solving abilities
              </p>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Recommendation System"
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Technologies Used</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL, Tailwind"
                  value={project.techStack}
                  onChange={(e) => setProject({ ...project, techStack: e.target.value })}
                  className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Description / Highlights</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what you built and key achievements..."
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">Your Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No projects added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">{p.title}</span>
                    {p.techStack && <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">{p.techStack}</span>}
                    {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Add Professional Certification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add verified credentials from AWS, Google, Oracle, Coursera, or recognized platforms
              </p>
            </div>

            <form onSubmit={handleAddCert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Certification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  value={cert.name}
                  onChange={(e) => setCert({ ...cert, name: e.target.value })}
                  className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Issuing Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={cert.issuer}
                  onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
                  className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition shadow-md shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Certification</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">Your Certifications ({certs.length})</h3>
            {certs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
            ) : (
              <div className="space-y-2">
                {certs.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      {c.name}
                    </span>
                    {c.issuer && <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{c.issuer}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Verified Skills ({skills.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add technical competencies to boost your overall AI job match scores
            </p>
          </div>

          {skills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No skills mapped yet. Update your skills in the Skills section.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((s) => (
                <span key={s.id} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg text-xs font-semibold">
                  {s.name} ({s.level})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
