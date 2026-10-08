import React, { useState } from 'react';
import api from '../services/api';
import {
  Search as SearchIcon,
  GraduationCap,
  Building2,
  School,
  Briefcase,
  Filter,
  Sparkles,
  Award,
  CheckCircle2,
  DollarSign,
  UserCheck
} from 'lucide-react';

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
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-blue-600" />
            Unified Portal Search & Intelligence Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cross-portal search across internships, jobs, candidates, partner colleges, and placement drives
          </p>
        </div>
      </div>

      {/* Styled Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm inline-flex flex-wrap gap-1">
        {[
          { id: 'student', label: 'Opportunities & Courses', icon: GraduationCap },
          { id: 'company', label: 'Candidate Talent Directory', icon: UserCheck },
          { id: 'college', label: 'Placement & Corporate Index', icon: School },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResults(null); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'student'
                  ? "Search by company name, job role, internship, or skill..."
                  : activeTab === 'company'
                  ? "Search candidates by name, USN, or keyword..."
                  : "Search by company, student USN, or placement records..."
              }
              className="pl-10 pr-4 py-3 w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20 disabled:opacity-50 shrink-0"
          >
            <SearchIcon className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Search Directory'}</span>
          </button>
        </div>

        {/* Talent Filters */}
        {activeTab === 'company' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 7.5"
                value={talentFilters.minCgpa}
                onChange={(e) => setTalentFilters({ ...talentFilters, minCgpa: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department</label>
              <select
                value={talentFilters.department}
                onChange={(e) => setTalentFilters({ ...talentFilters, department: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ISE">ISE</option>
                <option value="AIML">AIML</option>
                <option value="ECE">ECE</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Skill</label>
              <input
                type="text"
                placeholder="e.g. Python, React"
                value={talentFilters.skill}
                onChange={(e) => setTalentFilters({ ...talentFilters, skill: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Graduation Year</label>
              <input
                type="number"
                placeholder="e.g. 2027"
                value={talentFilters.graduationYear}
                onChange={(e) => setTalentFilters({ ...talentFilters, graduationYear: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        )}
      </form>

      {/* Results View */}
      {results && (
        <div className="space-y-6">
          {activeTab === 'student' && (
            <div className="space-y-6">
              {results.jobs && results.jobs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    Matching Jobs ({results.jobs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.jobs.map((j) => (
                      <div key={j.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white font-display">{j.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{j.company} • {j.location}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            {j.package}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {j.skills?.map((s) => (
                            <span key={s} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.internships && results.internships.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Matching Internships ({results.internships.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.internships.map((i) => (
                      <div key={i.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white font-display">{i.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{i.company} • Mode: {i.mode}</p>
                          </div>
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                            {i.stipend}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {i.skills?.map((s) => (
                            <span key={s} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'company' && Array.isArray(results) && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Matching Candidates ({results.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((cand) => (
                  <div key={cand.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white font-display">{cand.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cand.usn} • {cand.college}</p>
                      </div>
                      <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        CGPA {cand.cgpa}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Dept: {cand.department} | Batch: {cand.graduationYear}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cand.skills?.map((s) => (
                        <span key={s} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
