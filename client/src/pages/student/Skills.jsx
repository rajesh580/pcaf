import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';

export default function StudentSkills() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    studentService.getProfile().then((res) => {
      if (res.student && res.student.skills) {
        setSkills(res.student.skills);
      }
    });
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name) return;
    try {
      const res = await studentService.addOrUpdateSkill(newSkill);
      setSkills(res.skills);
      setMsg(`Skill '${newSkill.name}' updated with verified evidence!`);
      setNewSkill({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Skill Profile</h1>
        <p className="text-sm text-slate-500">Maintain verifiable technical skills backed by projects and credentials</p>
      </div>

      {msg && <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded border border-emerald-200">{msg}</div>}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Add or Upgrade Skill</h3>
        <form onSubmit={handleAddSkill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g. Python, React, SQL"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Proficiency Level</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Evidence (GitHub / Cert Link)</label>
            <input
              type="url"
              value={newSkill.evidenceUrl}
              onChange={(e) => setNewSkill({ ...newSkill, evidenceUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="https://github.com/..."
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            Save Skill
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">Current Verified Skills</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Skill</th>
              <th className="py-3 px-4">Proficiency</th>
              <th className="py-3 px-4">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {skills.map((s) => (
              <tr key={s.id || s.name}>
                <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">
                    {s.level}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs">
                  {s.evidenceUrl ? (
                    <a href={s.evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      View Credential / Repo
                    </a>
                  ) : (
                    <span className="text-slate-400">Self-declared</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
