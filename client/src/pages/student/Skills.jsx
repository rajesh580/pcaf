import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';

export default function StudentSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'INTERMEDIATE', evidenceUrl: '' });
  const [editingSkill, setEditingSkill] = useState(null); // When editing: { id, name, level, evidenceUrl }
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
        // Edit existing skill
        const res = await studentService.editSkill(editingSkill.id, newSkill);
        setSkills(res.skills || []);
        setMsg(`Skill '${newSkill.name}' updated successfully!`);
        setEditingSkill(null);
      } else {
        // Add new skill
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Skill Profile</h1>
        <p className="text-sm text-slate-500">
          Add, edit, or remove verifiable technical skills backed by projects and credentials
        </p>
      </div>

      {msg && (
        <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg border border-emerald-200 flex justify-between items-center">
          <span>✅ {msg}</span>
          <button onClick={() => setMsg('')} className="font-bold text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3.5 rounded-lg border border-red-200 flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="font-bold text-red-600 hover:text-red-900">×</button>
        </div>
      )}

      {/* Add / Edit Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {editingSkill ? `✏️ Edit Skill: ${editingSkill.name}` : '➕ Add New Technical Skill'}
          </h3>
          {editingSkill && (
            <button
              onClick={handleCancelEdit}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-md transition font-semibold"
            >
              Cancel Editing
            </button>
          )}
        </div>

        <form onSubmit={handleAddOrUpdateSkill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Python, React, PostgreSQL"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Proficiency Level</label>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Evidence (GitHub / Cert URL)
            </label>
            <input
              type="url"
              value={newSkill.evidenceUrl}
              onChange={(e) => setNewSkill({ ...newSkill, evidenceUrl: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/..."
            />
          </div>

          <button
            type="submit"
            className={`font-semibold py-2 px-4 rounded-lg text-sm transition text-white shadow-sm ${
              editingSkill
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editingSkill ? 'Update Skill' : 'Add Skill'}
          </button>
        </form>
      </div>

      {/* Verified Skills List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-sm text-slate-900">Your Verified Skill Inventory</h2>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
            Total Skills: {skills.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading skill inventory...</div>
        ) : skills.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No technical skills added yet. Use the form above to record your skills.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Proficiency</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skills.map((s) => (
                <tr key={s.id || s.name} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        s.level === 'EXPERT'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : s.level === 'ADVANCED'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : s.level === 'INTERMEDIATE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {s.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {s.evidenceUrl ? (
                      <a
                        href={s.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium inline-flex items-center space-x-1"
                      >
                        <span>🌐 View Credential / Repo</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Self-declared</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded border border-slate-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleRemoveSkill(s.id, s.name)}
                      className="text-xs bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-medium px-2.5 py-1 rounded border border-rose-200 transition"
                    >
                      🗑️ Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
