import React, { useEffect, useState } from 'react';
import { internshipService } from '../../services/internshipService';
import { studentService } from '../../services/studentService';
import api from '../../services/api';
import ResumeChoice from '../../components/ResumeChoice';

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [evalModal, setEvalModal] = useState(null);

  // Application Confirmation Modal State
  const [applyModalOpp, setApplyModalOpp] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeType, setResumeType] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [addingSkill, setAddingSkill] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const [filterMode, setFilterMode] = useState('');
  const [msg, setMsg] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [modalError, setModalError] = useState('');

  const loadStudentProfile = async () => {
    const res = await studentService.getProfile();
    setStudent(res.student);
    return res.student;
  };

  useEffect(() => {
    loadStudentProfile();
    loadInternships();
  }, [filterMode]);

  const loadInternships = () => {
    internshipService.getAllInternships({ mode: filterMode || undefined })
      .then((res) => setInternships(res.internships || []))
      .finally(() => setLoading(false));
  };

  const handleEvaluate = async (internship) => {
    if (!student) return;
    try {
      const res = await internshipService.evaluateStudent(internship.id, student);
      setEvalModal(res.evaluation);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenApplyModal = (opp) => {
    setApplyModalOpp(opp);
    setModalMsg('');
    setModalError('');
    setResumeFile(null);
    setResumeType('');
  };

  const handleUploadNewResumeInModal = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    setModalMsg('');
    setModalError('');
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModalMsg('New resume uploaded and linked successfully!');
      await loadStudentProfile();
      setResumeFile(null);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Resume upload failed.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleQuickAddSuggestedSkill = async (skillName) => {
    setAddingSkill(skillName);
    setModalMsg('');
    setModalError('');
    try {
      await studentService.addOrUpdateSkill({
        name: skillName,
        level: 'INTERMEDIATE'
      });
      setModalMsg(`Skill '${skillName}' added to your profile!`);
      loadStudentProfile();
    } catch (err) {
      setModalError(err.response?.data?.error || `Failed to add skill '${skillName}'`);
    } finally {
      setAddingSkill('');
    }
  };

  const handleConfirmApplicationSubmit = async () => {
    if (!applyModalOpp || !student) return;
    if (!['UPLOADED', 'GENERATED'].includes(resumeType)) {
      setModalError('Choose which resume you want to send with this application.');
      return;
    }
    if (resumeType === 'UPLOADED' && !student.resumeUrl) {
      setModalError('Upload a resume first, or select your generated profile resume.');
      return;
    }

    setSubmittingApp(true);
    setModalMsg('');
    setModalError('');
    try {
      const res = await internshipService.applyForInternship({
        internshipId: applyModalOpp.id,
        internshipTitle: applyModalOpp.title,
        companyName: applyModalOpp.companyName,
        matchScore: 90,
        resumeType,
      });
      setMsg(`✅ Application for "${applyModalOpp.title}" at ${applyModalOpp.companyName} submitted successfully!`);
      setApplyModalOpp(null);
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Internship application failed.');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internship Opportunities</h1>
          <p className="text-sm text-slate-500">Discover and apply for curated internships matching your skills</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
          >
            <option value="">All Work Modes</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONLINE">Online (Remote)</option>
            <option value="OFFLINE">Offline (On-Site)</option>
          </select>
        </div>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200 font-medium">{msg}</div>}

      {/* Internship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {internships.map((opp) => (
          <div key={opp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase">{opp.companyName}</span>
                  <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold border border-slate-200">
                  {opp.mode}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3">{opp.description || 'Hands-on practical internship opportunity.'}</p>

              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div><strong>Stipend:</strong> {opp.stipend || 'Unpaid'} | <strong>Duration:</strong> {opp.duration || '3 Months'}</div>
                <div><strong>Location:</strong> {opp.location || 'Remote'} | <strong>CGPA Cutoff:</strong> ≥ {opp.minimumCgpa || opp.minCgpa || 6.0}</div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(opp.requiredSkills || []).map((s) => (
                  <span key={s.name} className="bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded">
                    {s.name} ({s.minLevel || 'Basic'})
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => handleEvaluate(opp)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Check My Eligibility
              </button>
              <button
                onClick={() => handleOpenApplyModal(opp)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm"
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1. Eligibility Modal */}
      {evalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Eligibility & Skill Match Result</h3>
              <button onClick={() => setEvalModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-xs uppercase font-medium text-slate-500">Eligibility Verdict</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${evalModal.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {evalModal.eligibilityText || (evalModal.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
              <span className="text-xs uppercase font-medium text-slate-500">Overall Match Score</span>
              <span className="text-lg font-bold text-blue-600">{evalModal.matchScoreFormatted || `${evalModal.matchScore}%`}</span>
            </div>

            <button
              onClick={() => setEvalModal(null)}
              className="w-full bg-slate-800 text-white text-xs font-medium py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 2. Application Confirmation Modal */}
      {applyModalOpp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                  Internship Application Confirmation
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{applyModalOpp.title}</h3>
                <p className="text-xs text-slate-300">{applyModalOpp.companyName} • {applyModalOpp.stipend || 'Unpaid'}</p>
              </div>
              <button
                onClick={() => setApplyModalOpp(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {modalMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">✅ {modalMsg}</div>}
              {modalError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">⚠️ {modalError}</div>}

              {/* Step 1: Resume Selection & Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  📄 Step 1: Confirm Resume Document to Submit
                </h4>

                {student?.resumeUrl ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500 text-lg">📄</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Linked Resume Document</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Ready for recruiter review</p>
                      </div>
                    </div>
                    <a
                      href="/student/resume"
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded font-semibold transition"
                    >
                      View Resume ↗
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                    No uploaded resume is linked. You can upload one here or choose your generated profile resume below.
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Upload & Link New Resume (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 flex-1"
                    />
                    <button
                      type="button"
                      disabled={!resumeFile || uploadingResume}
                      onClick={handleUploadNewResumeInModal}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {uploadingResume ? 'Uploading...' : 'Upload & Link'}
                    </button>
                  </div>
                </div>
              </div>

              <ResumeChoice student={student} value={resumeType} onChange={setResumeType} />

              {/* Step 2: Skill Match & Skill Suggestions */}
              {(() => {
                const reqSkills = applyModalOpp.requiredSkills || [];
                const studentSkillNames = (student?.skills || []).map(s => s.name.toLowerCase());
                const matchingSkills = reqSkills.filter(s => studentSkillNames.includes(s.name.toLowerCase()));
                const missingSkills = reqSkills.filter(s => !studentSkillNames.includes(s.name.toLowerCase()));

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      🎯 Step 2: Skill Compatibility & Suggestions
                    </h4>

                    {/* Matching Skills */}
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-700 uppercase mb-1.5">
                        ✅ Matching Skills in Profile ({matchingSkills.length}/{reqSkills.length})
                      </p>
                      {matchingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchingSkills.map((s) => (
                            <span key={s.name} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                              ✓ {s.name} ({s.minLevel || 'Basic'})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No matching skills found on your profile.</p>
                      )}
                    </div>

                    {/* Missing / Suggested Skills */}
                    {missingSkills.length > 0 && (
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-[11px] font-semibold text-amber-700 uppercase mb-1.5">
                          💡 Suggested Skills to Add to Your Profile ({missingSkills.length})
                        </p>
                        <p className="text-xs text-slate-500 mb-2">
                          Adding these missing required skills to your student profile will increase your match score with recruiters:
                        </p>
                        <div className="space-y-1.5">
                          {missingSkills.map((s) => (
                            <div key={s.name} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{s.name}</span>
                                <span className="text-[10px] text-slate-500 ml-2">Req: {s.minLevel || 'Basic'}</span>
                              </div>
                              <button
                                type="button"
                                disabled={addingSkill === s.name}
                                onClick={() => handleQuickAddSuggestedSkill(s.name)}
                                className="text-xs bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-md font-semibold transition disabled:opacity-50"
                              >
                                {addingSkill === s.name ? 'Adding...' : '+ Add to Profile'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Confirmation Action */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setApplyModalOpp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApp || !['UPLOADED', 'GENERATED'].includes(resumeType) || (resumeType === 'UPLOADED' && !student?.resumeUrl)}
                onClick={handleConfirmApplicationSubmit}
                className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {submittingApp ? 'Submitting Application...' : 'Confirm & Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
