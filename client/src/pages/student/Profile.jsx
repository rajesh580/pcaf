import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('academic');

  // Academic form initialized empty (no mock data)
  const [academic, setAcademic] = useState({
    degree: '',
    branch: '',
    semester: '',
    cgpa: '',
    tenthPercentage: '',
    twelfthOrDiplomaPercentage: '',
    backlogs: ''
  });

  // Project form
  const [project, setProject] = useState({ title: '', techStack: '', description: '' });
  // Certification form
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
      setMsg('Academic profile saved to database!');
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
    return <div className="p-8 text-center text-slate-500">Loading student profile...</div>;
  }

  const projects = profile?.academicProfile?.academicProjects || [];
  const certs = profile?.academicProfile?.certifications || [];
  const skills = profile?.skills || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.name || 'Student Profile'}</h1>
          <p className="text-sm text-slate-500">
            {profile?.college ? `${profile.college} • ${profile.department || 'Student'}` : 'Manage your academic and career records'}
          </p>
        </div>
        <div className="flex space-x-2">
          {['academic', 'projects', 'certifications', 'skills'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab}
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

      {/* Tab: Academic Profile */}
      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">Academic Profile & Scores</h2>
          <p className="text-xs text-slate-500 mb-4">Enter your current academic metrics used for placement eligibility</p>
          <form onSubmit={handleUpdateAcademic} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Degree Program</label>
              <input
                type="text"
                placeholder="e.g. B.E. / B.Tech"
                value={academic.degree}
                onChange={(e) => setAcademic({ ...academic, degree: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Branch / Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={academic.branch}
                onChange={(e) => setAcademic({ ...academic, branch: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Semester</label>
              <input
                type="number"
                placeholder="e.g. 6"
                value={academic.semester}
                onChange={(e) => setAcademic({ ...academic, semester: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current CGPA</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 8.4"
                value={academic.cgpa}
                onChange={(e) => setAcademic({ ...academic, cgpa: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">10th Grade Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 91.5"
                value={academic.tenthPercentage}
                onChange={(e) => setAcademic({ ...academic, tenthPercentage: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">12th / Diploma Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 88.0"
                value={academic.twelfthOrDiplomaPercentage}
                onChange={(e) => setAcademic({ ...academic, twelfthOrDiplomaPercentage: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Active Backlogs</label>
              <input
                type="number"
                placeholder="0"
                value={academic.backlogs}
                onChange={(e) => setAcademic({ ...academic, backlogs: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Save Academic Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add Academic or Personal Project</h2>
            <p className="text-xs text-slate-500 mb-4">Projects showcase your hands-on coding and problem-solving abilities</p>
            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Recommendation System"
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Technologies Used</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL"
                  value={project.techStack}
                  onChange={(e) => setProject({ ...project, techStack: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Key Features</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what you built..."
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Add Project
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Your Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No projects added yet.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="font-bold text-slate-800">{p.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add Professional Certification</h2>
            <p className="text-xs text-slate-500 mb-4">Add verified credentials from AWS, Google, Oracle, or recognized course platforms</p>
            <form onSubmit={handleAddCert} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  value={cert.name}
                  onChange={(e) => setCert({ ...cert, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Issuing Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={cert.issuer}
                  onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Add Certification
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Your Certifications ({certs.length})</h3>
            {certs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
            ) : (
              <div className="space-y-2">
                {certs.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Your Verified Skills ({skills.length})</h2>
          <p className="text-xs text-slate-500 mb-4">Add skills under the Skills menu to increase your AI skill match scores</p>
          {skills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No skills mapped yet. Go to "My Skills" to add your technical proficiencies.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
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
