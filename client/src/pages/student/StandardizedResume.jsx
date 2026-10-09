import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Plus,
  Trash2,
  RefreshCw,
  Layout,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  Sliders
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EMPTY_RESUME = {
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  college: '',
  degree: '',
  graduationYear: '',
  cgpa: '',
  skills: [],
  projects: [],
  certifications: [],
  experiences: []
};

export default function StandardizedResume() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('classic'); // 'classic' | 'modern' | 'technical'

  // Editable Form State
  const [resumeData, setResumeData] = useState(EMPTY_RESUME);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await studentService.getProfile();
      if (res.student) {
        const s = res.student;
        setResumeData({
          name: s.name || '',
          email: s.email || '',
          phone: '',
          location: '',
          linkedin: s.linkedinUrl || '',
          github: s.githubUrl || '',
          portfolio: '',
          summary: '',
          college: s.college || '',
          degree: s.department ? `${s.department} (${s.academicProfile?.degree || 'B.E. / B.Tech'})` : (s.academicProfile?.degree || ''),
          graduationYear: s.graduationYear || '',
          cgpa: s.cgpa ? `${s.cgpa} / 10.0` : '',
          skills: Array.isArray(s.skills)
            ? s.skills.map((sk) => ({ name: sk.skill?.name || sk.name || '', level: sk.level || 'INTERMEDIATE' }))
            : [],
          certifications: Array.isArray(s.certifications)
            ? s.certifications.map((c) => ({ name: c.name || '', issuer: 'Verified Credential' }))
            : [],
          projects: Array.isArray(s.projects)
            ? s.projects.map((p, idx) => ({
                id: idx + 1,
                title: p.title || '',
                techStack: '',
                description: ''
              }))
            : [],
          experiences: []
        });
      }
    } catch (err) {
      console.warn('Profile load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setResumeData(EMPTY_RESUME);
  };

  // Form Handlers
  const handleInputChange = (field, value) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: Date.now(),
          title: 'New Capstone Project',
          techStack: 'React, Python, SQL',
          description: 'Implemented core business logic, API integrations, and database schemas.'
        }
      ]
    }));
  };

  const handleRemoveProject = (id) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id)
    }));
  };

  const handleAddSkill = () => {
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: 'New Skill', level: 'INTERMEDIATE' }]
    }));
  };

  const handleRemoveSkill = (idx) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx)
    }));
  };

  const handleAddExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: Date.now(),
          role: 'Software Developer Intern',
          company: 'Innovation Labs',
          duration: 'Jan 2026 - Present',
          location: 'Bengaluru',
          description: 'Collaborated with engineering team to implement new product features and write unit tests.'
        }
      ]
    }));
  };

  const handleRemoveExperience = (id) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id)
    }));
  };

  // ATS Optimization Score Calculation
  const calculateATSScore = () => {
    let score = 50;
    if (resumeData.name) score += 5;
    if (resumeData.email) score += 5;
    if (resumeData.summary) score += 10;
    if (resumeData.skills.length >= 5) score += 10;
    if (resumeData.projects.length >= 1) score += 10;
    if (resumeData.certifications.length >= 1) score += 10;
    return Math.min(score, 98);
  };

  const atsScore = calculateATSScore();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500 text-xs">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
        Initializing ATS Resume Builder Studio from verified database records...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/student/resume" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              <ChevronLeft className="w-4 h-4" /> Resume Manager
            </Link>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 mt-1">
            ATS Resume Builder & Exporter Studio
          </h1>
          <p className="text-xs text-slate-500">
            Customize, preview, and print ATS-compliant standardized resumes automatically linked to your verified credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProfile}
            title="Reload verified data from your profile"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Profile</span>
          </button>

          <button
            onClick={handleClearAll}
            title="Clear all prefilled data"
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-900">ATS Readiness: {atsScore}%</span>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIVE EDITOR FORM (Hidden on Print) */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* Template Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-600" /> ATS Layout Template
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['classic', 'Classic Single Column'],
                ['modern', 'Modern Executive'],
                ['technical', 'Tech Specialist']
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTemplate(key)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    activeTemplate === key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Contact & Header Info
            </h3>
            <div className="space-y-2.5">
              <input
                type="text"
                value={resumeData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Full Name"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={resumeData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email Address"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
                <input
                  type="text"
                  value={resumeData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Phone Number"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={resumeData.github}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  placeholder="GitHub URL"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
                <input
                  type="text"
                  value={resumeData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="LinkedIn URL"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
              <textarea
                rows={3}
                value={resumeData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Professional Executive Summary"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Education */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" /> Education & Academic Details
            </h3>
            <div className="space-y-2.5">
              <input
                type="text"
                value={resumeData.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
                placeholder="College / University Name"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
              />
              <input
                type="text"
                value={resumeData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                placeholder="Degree & Major"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={resumeData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="Graduation Year"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
                <input
                  type="text"
                  value={resumeData.cgpa}
                  onChange={(e) => handleInputChange('cgpa', e.target.value)}
                  placeholder="CGPA / Score"
                  className="text-xs p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" /> Technical Skills ({resumeData.skills.length})
              </h3>
              <button onClick={handleAddSkill} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {resumeData.skills.map((sk, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={sk.name}
                    onChange={(e) => {
                      const updated = [...resumeData.skills];
                      updated[i].name = e.target.value;
                      setResumeData({ ...resumeData, skills: updated });
                    }}
                    className="flex-1 text-xs p-2 border rounded-xl bg-slate-50"
                  />
                  <select
                    value={sk.level}
                    onChange={(e) => {
                      const updated = [...resumeData.skills];
                      updated[i].level = e.target.value;
                      setResumeData({ ...resumeData, skills: updated });
                    }}
                    className="text-xs p-2 border rounded-xl bg-slate-50"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                  <button onClick={() => handleRemoveSkill(i)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> Projects ({resumeData.projects.length})
              </h3>
              <button onClick={handleAddProject} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>
            <div className="space-y-3">
              {resumeData.projects.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => {
                        const updated = resumeData.projects.map((pr) => pr.id === p.id ? { ...pr, title: e.target.value } : pr);
                        setResumeData({ ...resumeData, projects: updated });
                      }}
                      className="text-xs font-bold p-1.5 border rounded-lg bg-white w-full mr-2"
                    />
                    <button onClick={() => handleRemoveProject(p.id)} className="text-rose-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={p.techStack}
                    onChange={(e) => {
                      const updated = resumeData.projects.map((pr) => pr.id === p.id ? { ...pr, techStack: e.target.value } : pr);
                      setResumeData({ ...resumeData, projects: updated });
                    }}
                    placeholder="Tech Stack (e.g. React, Node.js)"
                    className="text-xs p-1.5 border rounded-lg bg-white w-full"
                  />
                  <textarea
                    rows={2}
                    value={p.description}
                    onChange={(e) => {
                      const updated = resumeData.projects.map((pr) => pr.id === p.id ? { ...pr, description: e.target.value } : pr);
                      setResumeData({ ...resumeData, projects: updated });
                    }}
                    placeholder="Project description / achievements"
                    className="text-xs p-1.5 border rounded-lg bg-white w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME ATS RESUME DOCUMENT PREVIEW */}
        <div className="lg:col-span-7 print:col-span-12">
          <div className="bg-white p-8 md:p-12 border border-slate-300 rounded-2xl shadow-md min-h-[900px] text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
            {/* RESUME HEADER */}
            <div className="border-b-2 border-slate-800 pb-4 space-y-1">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-950 font-display">
                {resumeData.name || 'Student Name'}
              </h1>
              <div className="text-xs text-slate-600 flex flex-wrap gap-2.5 font-medium pt-1">
                {resumeData.email && <span>{resumeData.email}</span>}
                {resumeData.phone && <span>• {resumeData.phone}</span>}
                {resumeData.location && <span>• {resumeData.location}</span>}
              </div>
              <div className="text-xs text-blue-600 flex flex-wrap gap-3 font-semibold pt-1">
                {resumeData.linkedin && (
                  <a href={resumeData.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn: {resumeData.linkedin}
                  </a>
                )}
                {resumeData.github && (
                  <a href={resumeData.github} target="_blank" rel="noreferrer">
                    GitHub: {resumeData.github}
                  </a>
                )}
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            {resumeData.summary && (
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {resumeData.summary}
                </p>
              </div>
            )}

            {/* EDUCATION */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Education & Academic Standing
              </h2>
              <div className="flex justify-between items-start text-xs">
                <div>
                  <h3 className="font-bold text-slate-950">{resumeData.college}</h3>
                  <p className="text-slate-700 italic">{resumeData.degree}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">Class of {resumeData.graduationYear}</span>
                  <p className="text-slate-600 font-medium">CGPA: {resumeData.cgpa}</p>
                </div>
              </div>
            </div>

            {/* TECHNICAL SKILLS */}
            {resumeData.skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Technical Core Competencies
                </h2>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resumeData.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-900 font-semibold text-[11px] rounded-md"
                    >
                      {sk.name} <span className="text-[10px] text-slate-500 font-normal">({sk.level})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* EXPERIENCE / INTERNSHIPS */}
            {resumeData.experiences.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Work & Internship Experience
                </h2>
                {resumeData.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>{exp.role} — {exp.company}</span>
                      <span className="text-slate-600 font-normal">{exp.duration}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ACADEMIC & CAPSTONE PROJECTS */}
            {resumeData.projects.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Academic & Capstone Projects
                </h2>
                {resumeData.projects.map((p) => (
                  <div key={p.id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>{p.title}</span>
                      <span className="text-slate-600 font-mono text-[11px]">{p.techStack}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CERTIFICATIONS & CREDENTIALS */}
            {resumeData.certifications.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Verified Certifications & Credentials
                </h2>
                <ul className="list-disc pl-5 text-xs text-slate-800 space-y-1">
                  {resumeData.certifications.map((c, idx) => (
                    <li key={idx}>
                      <strong className="text-slate-950">{c.name}</strong> — <span className="text-slate-600">{c.issuer || 'Verified Partner'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
