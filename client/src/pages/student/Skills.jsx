import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Award,
  X
} from 'lucide-react';

export default function StudentSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
  const [editingSkill, setEditingSkill] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadSkills = () => {
    studentService.getProfile()
      .then((res) => {
        if (res.student && res.student.skills) {
          setSkills(res.student.skills);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load skills.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleAddOrUpdateSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name) return;
    setMsg('');
    setError('');
    try {
      if (editingSkill) {
        const res = await studentService.editSkill(editingSkill.id, newSkill);
        setSkills(res.skills || []);
        setMsg(`Skill '${newSkill.name}' updated successfully!`);
        setEditingSkill(null);
      } else {
        const res = await studentService.addOrUpdateSkill(newSkill);
        setSkills(res.skills || []);
        setMsg(`Skill '${newSkill.name}' saved to your profile!`);
      }
      setNewSkill({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Operation failed.');
    }
  };

  const handleStartEdit = (s) => {
    setEditingSkill(s);
    setNewSkill({
      name: s.name || '',
      level: s.level || 'INTERMEDIATE',
      evidenceUrl: s.evidenceUrl || ''
    });
    setMsg('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingSkill(null);
    setNewSkill({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
  };

  const handleRemoveSkill = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove '${name}' from your skills?`)) return;
    setMsg('');
    setError('');
    try {
      const res = await studentService.removeSkill(id);
      setSkills(res.skills || []);
      setMsg(`Skill '${name}' removed.`);
      if (editingSkill && editingSkill.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove skill.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Technical Inventory
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Student Skill Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record, update, and manage verifiable technical competencies evaluated by recruiters
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Skills</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">{skills.length}</span>
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

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold p-4 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Add / Edit Form */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Add Technical Skill'}
          </h3>
          {editingSkill && (
            <button
              onClick={handleCancelEdit}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleAddOrUpdateSkill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Skill Name</label>
            <input
              type="text"
              required
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
              placeholder="e.g. Python, React, PostgreSQL"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Proficiency Level</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Evidence (GitHub / Cert URL)
            </label>
            <input
              type="url"
              value={newSkill.evidenceUrl}
              onChange={(e) => setNewSkill({ ...newSkill, evidenceUrl: e.target.value })}
              className="px-3.5 py-2.5 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
              placeholder="https://github.com/..."
            />
          </div>

          <button
            type="submit"
            className={`font-semibold py-2.5 px-5 rounded-xl text-xs transition text-white shadow-md inline-flex items-center justify-center gap-1.5 ${
              editingSkill
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingSkill ? 'Update Skill' : 'Save Skill'}</span>
          </button>
        </form>
      </div>

      {/* Verified Skills List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-base text-slate-900 dark:text-white font-display">Verified Skill Inventory ({skills.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading skill inventory...</div>
        ) : skills.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No technical skills added yet. Use the form above to record your skills.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Skill Name</th>
                  <th className="py-3.5 px-6 font-bold">Proficiency</th>
                  <th className="py-3.5 px-6 font-bold">Evidence Link</th>
                  <th className="py-3.5 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {skills.map((s) => (
                  <tr key={s.id || s.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white font-display">{s.name}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                          s.level === 'EXPERT'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                            : s.level === 'ADVANCED'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                            : s.level === 'INTERMEDIATE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {s.level}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {s.evidenceUrl ? (
                        <a
                          href={s.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Credential</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Self-declared</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleRemoveSkill(s.id, s.name)}
                        className="inline-flex items-center gap-1 text-xs bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white font-semibold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
