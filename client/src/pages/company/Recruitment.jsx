import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { internshipService } from '../../services/internshipService';
import { jobService } from '../../services/jobService';
import api from '../../services/api';

export default function CompanyRecruitment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'post-internship');
  const [msg, setMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [posting, setPosting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsError, setApplicationsError] = useState('');
  const [busyApplication, setBusyApplication] = useState('');
  const [expandedApplication, setExpandedApplication] = useState('');
  const [resumePreview, setResumePreview] = useState({ applicationId: '', url: '', mimeType: '', loading: false, error: '' });
  const [openings, setOpenings] = useState([]);
  const [openingsError, setOpeningsError] = useState('');
  const [busyOpening, setBusyOpening] = useState('');
  const [candidateFilters, setCandidateFilters] = useState({ search: '', skill: '', department: '', graduationYear: '', minCgpa: '' });
  const [candidates, setCandidates] = useState([]);
  const [candidateError, setCandidateError] = useState('');
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateSearched, setCandidateSearched] = useState(false);

  // Post Internship State
  const [internForm, setInternForm] = useState({
    title: '',
    description: '',
    location: 'Bangalore / Hybrid',
    duration: '6 Months',
    stipend: '₹35,000 / month',
    mode: 'HYBRID',
    graduationYear: 2027,
    minimumCgpa: 7.0,
    skillInput: '',
    requiredSkills: [{ name: 'Python', minLevel: 'INTERMEDIATE' }, { name: 'Machine Learning', minLevel: 'INTERMEDIATE' }],
    applicationDeadline: '2026-12-31'
  });

  // Post Job State
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: 'Bangalore / Hybrid',
    salaryPackage: '₹14 LPA',
    workMode: 'HYBRID',
    experience: 'Fresher (0-1 yrs)',
    graduationYear: 2027,
    minimumCgpa: 7.0,
    skillInput: '',
    requiredSkills: [{ name: 'Java', minLevel: 'INTERMEDIATE' }, { name: 'React', minLevel: 'INTERMEDIATE' }],
    applicationDeadline: '2026-12-31'
  });

  // Schedule Interview State
  const [interviewForm, setInterviewForm] = useState({
    roundName: 'Technical Interview',
    scheduledTime: '',
    meetingUrl: 'https://meet.google.com/pfac-hiring'
  });

  const handlePostInternship = async (e) => {
    e.preventDefault();
    setPosting(true);
    setFormError('');
    setMsg('');
    try {
      await internshipService.createInternship(internForm);
      setMsg(`Internship "${internForm.title}" published successfully!`);
      setInternForm({ ...internForm, title: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to post internship.');
    } finally {
      setPosting(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    setFormError('');
    setMsg('');
    try {
      await jobService.createJob(jobForm);
      setMsg(`Job opportunity "${jobForm.title}" published successfully!`);
      setJobForm({ ...jobForm, title: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to post job.');
    } finally {
      setPosting(false);
    }
  };

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    setMsg('Interview details saved. Choose a candidate and move their application to an interview stage to attach these details.');
  };

  const loadApplications = useCallback(async () => {
    setApplicationsError('');
    try {
      const { data } = await api.get('/internship-applications/company-applications');
      setApplications(data.applications || []);
    } catch (err) {
      setApplicationsError(err.response?.data?.error || 'Could not load applications.');
    }
  }, []);

  useEffect(() => {
    const previewUrl = resumePreview.url;
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [resumePreview.url]);

  const loadCandidateResume = async (application) => {
    if (resumePreview.applicationId === application.id && resumePreview.url) {
      setResumePreview({ applicationId: '', url: '', mimeType: '', loading: false, error: '' });
      return;
    }
    setResumePreview({ applicationId: application.id, url: '', mimeType: '', loading: true, error: '' });
    try {
      const response = await api.get(`/company-suite/candidate-resume/${application.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const mimeType = response.headers['content-type']?.split(';')[0] || response.data.type || 'application/pdf';
      setResumePreview({ applicationId: application.id, url, mimeType, loading: false, error: '' });
    } catch (error) {
      setResumePreview({ applicationId: application.id, url: '', mimeType: '', loading: false, error: 'Could not load the selected resume. It may be missing or unavailable.' });
    }
  };

  const updateApplication = async (application, nextStatus) => {
    setBusyApplication(application.id);
    try {
      const roundDetails = ['TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'INTERVIEW'].includes(nextStatus) && interviewForm.scheduledTime
        ? { roundName: interviewForm.roundName || nextStatus.replaceAll('_', ' '), scheduledAt: new Date(interviewForm.scheduledTime).toISOString(), instructions: 'Please join a few minutes early.', platformUrl: interviewForm.meetingUrl }
        : undefined;
      await api.patch(`/internship-applications/${application.id}/status`, { nextStatus, roundDetails });
      await loadApplications();
      setMsg(`Application moved to ${nextStatus.replaceAll('_', ' ')}.`);
    } catch (err) {
      setApplicationsError(err.response?.data?.error || 'Could not update this application.');
    } finally { setBusyApplication(''); }
  };

  const loadOpenings = useCallback(async () => {
    setOpeningsError('');
    try {
      const { data } = await api.get('/company-suite/opportunities');
      setOpenings(data.opportunities || []);
    } catch (err) {
      setOpeningsError(err.response?.data?.error || 'Could not load your openings.');
    }
  }, []);

  const changeOpeningStatus = async (opening, status) => {
    setBusyOpening(opening.id);
    setOpeningsError('');
    try {
      await api.patch(`/company-suite/opportunities/${opening.id}/status`, { status });
      await loadOpenings();
      setMsg(`“${opening.title}” is now ${status.toLowerCase()}.`);
    } catch (err) {
      setOpeningsError(err.response?.data?.error || 'Could not update this opening.');
    } finally {
      setBusyOpening('');
    }
  };

  const loadCandidates = async (event) => {
    event?.preventDefault();
    setCandidateLoading(true);
    setCandidateError('');
    setCandidateSearched(true);
    try {
      const params = Object.fromEntries(Object.entries(candidateFilters).filter(([, value]) => value !== ''));
      const { data } = await api.get('/collaboration/students/search', { params });
      setCandidates(data.students || []);
    } catch (err) {
      setCandidateError(err.response?.data?.error || 'Could not search student profiles.');
      setCandidates([]);
    } finally {
      setCandidateLoading(false);
    }
  };

  const chooseTab = (tab) => {
    setActiveTab(tab);
    setMsg('');
    setFormError('');
    navigate({ pathname: location.pathname, search: tab === 'post-internship' ? '' : `?tab=${tab}` }, { replace: true });
  };

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get('tab') || 'post-internship';
    if (['post-internship', 'post-job', 'applications', 'openings', 'candidates', 'schedule'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'applications') loadApplications();
    if (activeTab === 'openings') loadOpenings();
  }, [activeTab, loadApplications, loadOpenings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Corporate Recruitment Suite (Section 19)</h1>
        <p className="text-sm text-slate-500">Publish opportunities, schedule interviews, and manage talent pipeline</p>
      </div>

      {msg && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">{msg}</div>}
      {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">{formError}</div>}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {[
          ['post-internship', 'Publish internship'],
          ['post-job', 'Publish placement job'],
          ['applications', 'Applications'],
          ['openings', 'My openings'],
          ['candidates', 'Find candidates'],
          ['schedule', 'Interview details'],
        ].map(([tab, label]) => (
          <button
            type="button"
            key={tab}
            onClick={() => chooseTab(tab)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Post Internship */}
      {activeTab === 'post-internship' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">Publish New Internship Opportunity</h2>
          <form onSubmit={handlePostInternship} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Internship Title</label>
                <input
                  type="text"
                  required
                  value={internForm.title}
                  onChange={(e) => setInternForm({ ...internForm, title: e.target.value })}
                  placeholder="e.g. AI/ML Intern"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Stipend Amount</label>
                <input
                  type="text"
                  value={internForm.stipend}
                  onChange={(e) => setInternForm({ ...internForm, stipend: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. ₹35,000 / month"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work Mode</label>
                <select
                  value={internForm.mode}
                  onChange={(e) => setInternForm({ ...internForm, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONLINE">Online (Remote)</option>
                  <option value="OFFLINE">Offline (On-Site)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={internForm.location}
                  onChange={(e) => setInternForm({ ...internForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Bangalore / Remote"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Duration</label>
                <input
                  type="text"
                  value={internForm.duration}
                  onChange={(e) => setInternForm({ ...internForm, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. 6 Months"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Minimum CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={internForm.minimumCgpa}
                  onChange={(e) => setInternForm({ ...internForm, minimumCgpa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Graduation Batch Year</label>
                <input
                  type="number"
                  value={internForm.graduationYear}
                  onChange={(e) => setInternForm({ ...internForm, graduationYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Application Deadline</label>
                <input
                  type="date"
                  required
                  value={internForm.applicationDeadline}
                  onChange={(e) => setInternForm({ ...internForm, applicationDeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Internship Description & Expectations</label>
              <textarea
                rows={3}
                value={internForm.description}
                onChange={(e) => setInternForm({ ...internForm, description: e.target.value })}
                placeholder="Describe key responsibilities, deliverables, learning outcomes, and prerequisites..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {/* Required Skills Management */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Required Technical Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Python, Docker, SQL)"
                  value={internForm.skillInput || ''}
                  onChange={(e) => setInternForm({ ...internForm, skillInput: e.target.value })}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (internForm.skillInput?.trim()) {
                      const newSkillName = internForm.skillInput.trim();
                      if (!internForm.requiredSkills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase())) {
                        setInternForm({
                          ...internForm,
                          requiredSkills: [...internForm.requiredSkills, { name: newSkillName, minLevel: 'INTERMEDIATE' }],
                          skillInput: ''
                        });
                      }
                    }
                  }}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                >
                  + Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {internForm.requiredSkills.map((s, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <select
                      value={s.minLevel}
                      onChange={(e) => {
                        const updated = [...internForm.requiredSkills];
                        updated[idx].minLevel = e.target.value;
                        setInternForm({ ...internForm, requiredSkills: updated });
                      }}
                      className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 font-medium"
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setInternForm({
                          ...internForm,
                          requiredSkills: internForm.requiredSkills.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={posting} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition disabled:opacity-60">
              {posting ? 'Publishing…' : 'Publish Internship'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Post Job */}
      {activeTab === 'post-job' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">Publish Full-Time Job Opportunity</h2>
          <form onSubmit={handlePostJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Software Development Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Salary Package CTC</label>
                <input
                  type="text"
                  value={jobForm.salaryPackage}
                  onChange={(e) => setJobForm({ ...jobForm, salaryPackage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. ₹14 LPA"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work Mode</label>
                <select
                  value={jobForm.workMode}
                  onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONLINE">Online (Remote)</option>
                  <option value="OFFLINE">Offline (On-Site)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location</label>
                <input
                  type="text"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Bangalore / Hyderabad"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Experience Level</label>
                <input
                  type="text"
                  value={jobForm.experience}
                  onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. Fresher (0-1 yrs)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Minimum CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={jobForm.minimumCgpa}
                  onChange={(e) => setJobForm({ ...jobForm, minimumCgpa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Graduation Batch Year</label>
                <input
                  type="number"
                  value={jobForm.graduationYear}
                  onChange={(e) => setJobForm({ ...jobForm, graduationYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Application Deadline</label>
                <input
                  type="date"
                  required
                  value={jobForm.applicationDeadline}
                  onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Job Description & Responsibilities</label>
              <textarea
                rows={3}
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Describe role responsibilities, tech stack, team structure, and prerequisites..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {/* Required Skills Management */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Required Technical Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Java, React, System Design)"
                  value={jobForm.skillInput || ''}
                  onChange={(e) => setJobForm({ ...jobForm, skillInput: e.target.value })}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (jobForm.skillInput?.trim()) {
                      const newSkillName = jobForm.skillInput.trim();
                      if (!jobForm.requiredSkills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase())) {
                        setJobForm({
                          ...jobForm,
                          requiredSkills: [...jobForm.requiredSkills, { name: newSkillName, minLevel: 'INTERMEDIATE' }],
                          skillInput: ''
                        });
                      }
                    }
                  }}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                >
                  + Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {jobForm.requiredSkills.map((s, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <select
                      value={s.minLevel}
                      onChange={(e) => {
                        const updated = [...jobForm.requiredSkills];
                        updated[idx].minLevel = e.target.value;
                        setJobForm({ ...jobForm, requiredSkills: updated });
                      }}
                      className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 font-medium"
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setJobForm({
                          ...jobForm,
                          requiredSkills: jobForm.requiredSkills.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={posting} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition disabled:opacity-60">
              {posting ? 'Publishing…' : 'Publish Full-Time Job'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'openings' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-bold text-slate-900">Manage company openings</h2><p className="mt-1 text-sm text-slate-500">Pause an opening while you review applicants, or reopen it when you are ready.</p></div>
            <button type="button" onClick={loadOpenings} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Refresh openings</button>
          </div>
          {openingsError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{openingsError}</div>}
          {openings.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {openings.map((opening) => (
                <article key={opening.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><span className="text-xs font-semibold uppercase tracking-wide text-amber-700">{opening.type === 'JOB' ? 'Full-time role' : 'Internship'}</span><h3 className="mt-1 text-base font-bold text-slate-900">{opening.title}</h3></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${opening.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : opening.status === 'PAUSED' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{opening.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-y border-slate-100 py-3 text-xs">
                    <div><span className="block text-slate-400">Applicants</span><strong className="mt-1 block text-sm text-slate-800">{opening.applicationCount}</strong></div>
                    <div><span className="block text-slate-400">Work mode</span><strong className="mt-1 block text-sm text-slate-800">{opening.workMode}</strong></div>
                    <div><span className="block text-slate-400">Deadline</span><strong className="mt-1 block text-sm text-slate-800">{new Date(opening.deadline).toLocaleDateString()}</strong></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {opening.status !== 'CLOSED' && <button type="button" disabled={busyOpening === opening.id} onClick={() => changeOpeningStatus(opening, opening.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busyOpening === opening.id ? 'Saving…' : opening.status === 'ACTIVE' ? 'Pause opening' : 'Reopen opening'}</button>}
                    {opening.status !== 'CLOSED' && <button type="button" disabled={busyOpening === opening.id} onClick={() => { if (window.confirm(`Close “${opening.title}” to new applicants?`)) changeOpeningStatus(opening, 'CLOSED'); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">Close opening</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="font-semibold text-slate-800">No company openings found</h3><p className="mt-1 text-sm text-slate-500">Publish a job or internship to start receiving applications.</p></div>}
        </section>
      )}

      {activeTab === 'candidates' && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-bold text-slate-900">Find candidates</h2><p className="mt-1 text-sm text-slate-500">Search student profiles by skills, department, graduation year, or academic performance.</p></div>
          <form onSubmit={loadCandidates} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
            <div><label htmlFor="candidate-search" className="mb-1 block text-xs font-semibold text-slate-600">Name, college, or skill</label><input id="candidate-search" value={candidateFilters.search} onChange={(event) => setCandidateFilters({ ...candidateFilters, search: event.target.value })} placeholder="Search profiles" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label htmlFor="candidate-skill" className="mb-1 block text-xs font-semibold text-slate-600">Required skill</label><input id="candidate-skill" value={candidateFilters.skill} onChange={(event) => setCandidateFilters({ ...candidateFilters, skill: event.target.value })} placeholder="e.g. Python" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label htmlFor="candidate-department" className="mb-1 block text-xs font-semibold text-slate-600">Department</label><input id="candidate-department" value={candidateFilters.department} onChange={(event) => setCandidateFilters({ ...candidateFilters, department: event.target.value })} placeholder="Name or department code" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label htmlFor="candidate-year" className="mb-1 block text-xs font-semibold text-slate-600">Graduation year</label><input id="candidate-year" type="number" min="2000" max="2100" value={candidateFilters.graduationYear} onChange={(event) => setCandidateFilters({ ...candidateFilters, graduationYear: event.target.value })} placeholder="e.g. 2027" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label htmlFor="candidate-cgpa" className="mb-1 block text-xs font-semibold text-slate-600">Minimum CGPA</label><input id="candidate-cgpa" type="number" min="0" max="10" step="0.1" value={candidateFilters.minCgpa} onChange={(event) => setCandidateFilters({ ...candidateFilters, minCgpa: event.target.value })} placeholder="e.g. 7.5" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div className="flex items-end"><button type="submit" disabled={candidateLoading} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{candidateLoading ? 'Searching…' : 'Search students'}</button></div>
          </form>
          {candidateError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{candidateError}</div>}
          {candidateLoading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Searching student profiles…</div> : candidates.length ? (
            <div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{candidates.length} matching student{candidates.length === 1 ? '' : 's'}{candidates.length === 100 ? ' · showing first 100' : ''}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{candidate.name}</h3><p className="mt-1 text-xs text-slate-500">{candidate.college}</p><p className="text-xs text-slate-500">{candidate.department} · Class of {candidate.graduationYear}</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">CGPA {Number(candidate.cgpa || 0).toFixed(2)}</span></div>
                <div className="mt-4 flex min-h-12 flex-wrap content-start gap-1.5">{candidate.skills.length ? candidate.skills.slice(0, 8).map((skill) => <span key={skill.name} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{skill.name} · {skill.level.toLowerCase()}</span>) : <span className="text-xs text-slate-400">No skills listed</span>}</div>
                <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3 text-xs font-semibold">{candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn ↗</a>}{candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">GitHub ↗</a>}{!candidate.linkedinUrl && !candidate.githubUrl && <span className="text-slate-400">No public links provided</span>}</div>
              </article>
            ))}</div></div>
          ) : candidateSearched ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="font-semibold text-slate-800">No matching students</h3><p className="mt-1 text-sm text-slate-500">Adjust your search filters and try again.</p></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Choose one or more filters, then search to discover student profiles.</div>}
        </section>
      )}

      {/* Tab 3: Schedule Interview */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="mb-4 text-sm text-slate-500">Set the interview details, then open Applications and move the selected candidate to Technical Interview or HR Interview. The schedule will be stored with that application.</p>
          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Interview Round</label>
                <input
                  type="text"
                  value={interviewForm.roundName}
                  onChange={(e) => setInterviewForm({ ...interviewForm, roundName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Candidate meeting link</label>
                <input
                  type="url"
                  value={interviewForm.meetingUrl}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meetingUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.scheduledTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition">
              Save Interview Details
            </button>
          </form>
        </div>
      )}

      {activeTab === 'applications' && (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Candidate applications</h2>
            <p className="mt-1 text-sm text-slate-500">Review candidates and move each application through the selection stages. To schedule an interview, enter its date in the Schedule Interview tab first.</p>
          </div>
          {applicationsError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{applicationsError}</div>}
          {applications.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No applications have been received yet.</div> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Candidate</th><th className="px-4 py-3">Opportunity</th><th className="px-4 py-3">Match</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Move to next stage</th></tr></thead><tbody className="divide-y divide-slate-100">{applications.map((application) => {
            const allowed = { APPLIED: ['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'], UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'], SHORTLISTED: ['ASSESSMENT', 'TECHNICAL_INTERVIEW', 'REJECTED'], ASSESSMENT: ['TECHNICAL_INTERVIEW', 'REJECTED'], TECHNICAL_INTERVIEW: ['HR_INTERVIEW', 'SELECTED', 'REJECTED'], HR_INTERVIEW: ['SELECTED', 'REJECTED'], SELECTED: ['INTERNSHIP_STARTED'], INTERNSHIP_STARTED: ['INTERNSHIP_COMPLETED'] }[application.status] || [];
            const expanded = expandedApplication === application.id;
            const hasResume = resumePreview.applicationId === application.id && resumePreview.url;
            return <React.Fragment key={application.id}><tr><td className="px-4 py-3"><p className="font-medium text-slate-900">{application.studentName}</p><p className="text-xs text-slate-500">{application.studentEmail}</p><button type="button" aria-expanded={expanded} onClick={() => { setExpandedApplication(expanded ? '' : application.id); if (!expanded && resumePreview.applicationId !== application.id) setResumePreview({ applicationId: '', url: '', mimeType: '', loading: false, error: '' }); }} className="mt-1 text-xs font-semibold text-blue-700 hover:text-blue-900">{expanded ? 'Hide profile' : 'View profile'}</button></td><td className="px-4 py-3">{application.internshipTitle}<p className="text-xs text-slate-500">{application.opportunityType}</p></td><td className="px-4 py-3">{application.matchScore}%</td><td className="px-4 py-3">{application.status.replaceAll('_', ' ')}</td><td className="px-4 py-3">{allowed.length ? <select disabled={busyApplication === application.id} value="" onChange={(event) => updateApplication(application, event.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"><option value="">Choose stage</option>{allowed.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select> : <span className="text-xs text-slate-400">No further stages</span>}</td></tr>{expanded && <tr><td colSpan={5} className="bg-slate-50 px-4 py-4"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"><section className="space-y-4"><div><h3 className="font-semibold text-slate-900">Student profile</h3><p className="mt-1 text-xs text-slate-500">{[application.studentCollege, application.studentDepartment].filter(Boolean).join(' · ') || 'College details not provided'}{application.studentGraduationYear ? ` · Class of ${application.studentGraduationYear}` : ''}{application.studentCgpa != null ? ` · CGPA ${application.studentCgpa}` : ''}</p><p className="mt-1 text-[11px] font-semibold text-amber-700">Submitted resume: {application.submittedResumeType === 'GENERATED' ? 'Generated profile resume' : application.submittedResumeType === 'UPLOADED' ? 'Uploaded resume' : 'Profile resume'}</p></div><div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</h4><div className="flex flex-wrap gap-2">{application.studentSkills?.length ? application.studentSkills.map((skill) => <span key={skill.name} className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs text-slate-700">{skill.name}<span className="ml-1 text-slate-400">{skill.level?.toLowerCase()}</span></span>) : <span className="text-sm text-slate-400">No skills listed</span>}</div></div><div className="grid gap-3 sm:grid-cols-2"><div><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Certifications</h4><p className="text-sm text-slate-700">{application.studentCertifications?.length ? application.studentCertifications.map((item) => item.name).join(', ') : 'None listed'}</p></div><div><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</h4><p className="text-sm text-slate-700">{application.studentProjects?.length ? application.studentProjects.join(', ') : 'None listed'}</p></div></div><button type="button" onClick={() => loadCandidateResume(application)} disabled={resumePreview.loading && resumePreview.applicationId === application.id} className="rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{resumePreview.loading && resumePreview.applicationId === application.id ? 'Loading resume…' : hasResume ? 'Hide resume preview' : 'View submitted resume'}</button>{resumePreview.applicationId === application.id && resumePreview.error && <p role="alert" className="text-sm text-rose-700">{resumePreview.error}</p>}</section><section>{hasResume ? <iframe title={`${application.studentName} submitted resume`} src={resumePreview.url} sandbox={resumePreview.mimeType === 'text/html' ? '' : undefined} className="h-[620px] w-full rounded-lg border border-slate-200 bg-white" /> : <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Preview the resume the student selected for this application.</div>}</section></div></td></tr>}</React.Fragment>;
          })}</tbody></table></div>}
        </section>
      )}
    </div>
  );
}
