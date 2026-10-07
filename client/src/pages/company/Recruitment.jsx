import React, { useState } from 'react';
import { companyService } from '../../services/companyService';
import { internshipService } from '../../services/internshipService';
import { jobService } from '../../services/jobService';

export default function CompanyRecruitment() {
  const [activeTab, setActiveTab] = useState('post-internship');
  const [msg, setMsg] = useState('');

  // Post Internship State
  const [internForm, setInternForm] = useState({
    title: '',
    duration: '6 Months',
    stipend: '₹35,000 / month',
    mode: 'HYBRID',
    graduationYear: 2027,
    minimumCgpa: 7.0,
    requiredSkills: [{ name: 'Python', minLevel: 'INTERMEDIATE' }, { name: 'Machine Learning', minLevel: 'INTERMEDIATE' }],
    applicationDeadline: '2026-12-31'
  });

  // Post Job State
  const [jobForm, setJobForm] = useState({
    title: '',
    salaryPackage: '₹14 LPA',
    workMode: 'HYBRID',
    graduationYear: 2027,
    minimumCgpa: 7.0,
    requiredSkills: [{ name: 'Java', minLevel: 'INTERMEDIATE' }, { name: 'React', minLevel: 'INTERMEDIATE' }],
    applicationDeadline: '2026-12-31'
  });

  // Schedule Interview State
  const [interviewForm, setInterviewForm] = useState({
    studentName: '',
    studentEmail: '',
    roleTitle: 'Software Engineer',
    roundName: 'Technical Interview',
    scheduledTime: '',
    meetingUrl: 'https://meet.google.com/pfac-hiring'
  });

  const handlePostInternship = async (e) => {
    e.preventDefault();
    try {
      await internshipService.createInternship(internForm);
      setMsg(`Internship "${internForm.title}" published successfully!`);
      setInternForm({ ...internForm, title: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post internship.');
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await jobService.createJob(jobForm);
      setMsg(`Job opportunity "${jobForm.title}" published successfully!`);
      setJobForm({ ...jobForm, title: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post job.');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await companyService.scheduleInterview(interviewForm);
      setMsg(`Interview scheduled for ${interviewForm.studentName}!`);
      setInterviewForm({ ...interviewForm, studentName: '', studentEmail: '', scheduledTime: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Corporate Recruitment Suite (Section 19)</h1>
        <p className="text-sm text-slate-500">Publish opportunities, schedule interviews, and manage talent pipeline</p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200">{msg}</div>}

      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('post-internship')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'post-internship' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Publish Internship
        </button>
        <button
          onClick={() => setActiveTab('post-job')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'post-job' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Publish Placement Job
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Schedule Interview
        </button>
      </div>

      {/* Tab 1: Post Internship */}
      {activeTab === 'post-internship' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Duration</label>
                <input
                  type="text"
                  value={internForm.duration}
                  onChange={(e) => setInternForm({ ...internForm, duration: e.target.value })}
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
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition">
              Publish Internship
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Post Job */}
      {activeTab === 'post-job' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handlePostJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Software Engineer"
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
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition">
              Publish Full-Time Job
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Schedule Interview */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={interviewForm.studentName}
                  onChange={(e) => setInterviewForm({ ...interviewForm, studentName: e.target.value })}
                  placeholder="Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
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
              Confirm & Dispatch Interview Invitation
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
