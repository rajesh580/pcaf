import React, { useState } from 'react';
import api from '../services/api';

export default function Search() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'company' | 'college'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Filters for company talent search
  const [talentFilters, setTalentFilters] = useState({
    minCgpa: '',
    department: '',
    skill: '',
    graduationYear: ''
  });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResults(null);
    try {
      if (activeTab === 'student') {
        const res = await api.get(`/search/student-search?query=${encodeURIComponent(query)}`);
        setResults(res.data.results);
      } else if (activeTab === 'company') {
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        if (talentFilters.minCgpa) params.append('minCgpa', talentFilters.minCgpa);
        if (talentFilters.department) params.append('department', talentFilters.department);
        if (talentFilters.skill) params.append('skill', talentFilters.skill);
        if (talentFilters.graduationYear) params.append('graduationYear', talentFilters.graduationYear);
        const res = await api.get(`/search/company-search?${params.toString()}`);
        setResults(res.data.candidates);
      } else if (activeTab === 'college') {
        const res = await api.get(`/search/college-search?query=${encodeURIComponent(query)}`);
        setResults(res.data.results);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Unified Search & Intelligence Directory</h1>
        <p className="text-sm text-slate-500">Cross-portal search across internships, jobs, candidates, colleges, and training tracks</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('student'); setResults(null); }}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'student' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🎓 Opportunities & Courses
        </button>
        <button
          onClick={() => { setActiveTab('company'); setResults(null); }}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'company' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🏢 Candidate Talent Directory
        </button>
        <button
          onClick={() => { setActiveTab('college'); setResults(null); }}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'college' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🏛️ Placement & Corporate Index
        </button>
      </div>

      {/* Search Input and Filters */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === 'student'
                ? "Search by company name, job role, internship, or skill..."
                : activeTab === 'company'
                ? "Search candidate by name, USN, or keyword..."
                : "Search by company, student USN, or placement records..."
            }
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium text-sm transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters for Company Tab */}
        {activeTab === 'company' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 7.5"
                value={talentFilters.minCgpa}
                onChange={(e) => setTalentFilters({ ...talentFilters, minCgpa: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-xs border rounded"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Department</label>
              <select
                value={talentFilters.department}
                onChange={(e) => setTalentFilters({ ...talentFilters, department: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-xs border rounded bg-white"
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ISE">ISE</option>
                <option value="AIML">AIML</option>
                <option value="ECE">ECE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Skill</label>
              <input
                type="text"
                placeholder="e.g. Python, React"
                value={talentFilters.skill}
                onChange={(e) => setTalentFilters({ ...talentFilters, skill: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-xs border rounded"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Graduation Year</label>
              <input
                type="number"
                placeholder="e.g. 2027"
                value={talentFilters.graduationYear}
                onChange={(e) => setTalentFilters({ ...talentFilters, graduationYear: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-xs border rounded"
              />
            </div>
          </div>
        )}
      </form>

      {/* Results View */}
      {results && (
        <div className="space-y-6">
          {/* Active Tab: Student (Jobs, Internships, Companies, Courses) */}
          {activeTab === 'student' && (
            <div className="space-y-6">
              {results.jobs && results.jobs.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">Matching Full-Time Jobs ({results.jobs.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.jobs.map((j) => (
                      <div key={j.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{j.title}</h4>
                            <p className="text-xs text-slate-500">{j.company} • {j.location}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{j.package}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {j.skills?.map((s) => (
                            <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.internships && results.internships.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">Matching Internships ({results.internships.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.internships.map((i) => (
                      <div key={i.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{i.title}</h4>
                            <p className="text-xs text-slate-500">{i.company} • Mode: {i.mode}</p>
                          </div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{i.stipend}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {i.skills?.map((s) => (
                            <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.companies && results.companies.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">Matching Companies ({results.companies.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.companies.map((c) => (
                      <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-semibold text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.industry} • {c.location}</p>
                        <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          {c.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Tab: Company (Candidates Array) */}
          {activeTab === 'company' && Array.isArray(results) && (
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-3">Matching Candidates ({results.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((cand) => (
                  <div key={cand.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{cand.name}</h4>
                        <p className="text-xs text-slate-500">{cand.usn} • {cand.college}</p>
                      </div>
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">CGPA {cand.cgpa}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Dept: {cand.department} | Batch: {cand.graduationYear}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cand.skills?.map((s) => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Tab: College (Students, Companies, Opportunities, Records) */}
          {activeTab === 'college' && (
            <div className="space-y-6">
              {results.placementRecords && results.placementRecords.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3">Placement Records ({results.placementRecords.length})</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Student</th>
                          <th className="py-2.5 px-4">USN</th>
                          <th className="py-2.5 px-4">Company</th>
                          <th className="py-2.5 px-4">Role</th>
                          <th className="py-2.5 px-4">Package</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {results.placementRecords.map((r) => (
                          <tr key={r.id}>
                            <td className="py-3 px-4 font-semibold text-slate-800">{r.studentName}</td>
                            <td className="py-3 px-4 text-slate-500">{r.usn}</td>
                            <td className="py-3 px-4 text-slate-700">{r.company}</td>
                            <td className="py-3 px-4 text-slate-600">{r.role}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">{r.package}</td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
