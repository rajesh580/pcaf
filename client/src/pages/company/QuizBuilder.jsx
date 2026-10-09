import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainingService } from '../../services/trainingService';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Save,
  HelpCircle,
  Eye,
  Edit3,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';

export default function QuizBuilder() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        setLoading(true);
        const data = await trainingService.details(programId);
        if (data.program) {
          setProgram(data.program);
          if (Array.isArray(data.program.quizQuestions) && data.program.quizQuestions.length > 0) {
            setQuestions(data.program.quizQuestions);
          } else {
            // Starter default question structure
            setQuestions([
              {
                id: 'q-1',
                q: 'What is the primary objective of this program?',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correct: 0,
                points: 20
              }
            ]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load program details.');
      } finally {
        setLoading(false);
      }
    };
    loadProgram();
  }, [programId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        q: '',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct: 0,
        points: 20
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      alert('A quiz must have at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].q = text;
    setQuestions(updated);
  };

  const updatePoints = (index, points) => {
    const updated = [...questions];
    updated[index].points = Number(points) || 10;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) {
      alert('Maximum 6 options allowed per question.');
      return;
    }
    updated[qIndex].options.push(`Option ${updated[qIndex].options.length + 1}`);
    setQuestions(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      alert('At least 2 options required.');
      return;
    }
    updated[qIndex].options.splice(optIndex, 1);
    if (updated[qIndex].correct >= updated[qIndex].options.length) {
      updated[qIndex].correct = 0;
    }
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updated = [...questions];
    updated[qIndex].correct = optIndex;
    setQuestions(updated);
  };

  const saveQuiz = async () => {
    // Validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].q.trim()) {
        setError(`Question #${i + 1} text cannot be empty.`);
        return;
      }
      if (questions[i].options.some((opt) => !opt.trim())) {
        setError(`Question #${i + 1} contains empty option fields.`);
        return;
      }
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await trainingService.saveQuizQuestions(programId, questions);
      setMessage(res.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quiz questions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading Quiz Builder Form...</p>
      </div>
    );
  }

  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/skill-provider"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isPreview
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" /> {isPreview ? 'Exit Preview' : 'Google Form Student Preview'}
          </button>

          <button
            onClick={saveQuiz}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Form...' : 'Publish Quiz Form'}
          </button>
        </div>
      </div>

      {/* Google Form Title Banner */}
      <div className="rounded-2xl border-t-8 border-t-blue-600 border-x border-b border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-100">
            Google Form Style Assessment Builder
          </span>
          <span className="text-xs font-bold text-slate-500">Total Quiz Score: {totalPoints} Points</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">{program?.title}</h1>
        <p className="text-xs text-slate-500">{program?.domain} · Proctored Online Assessment Bank</p>
      </div>

      {/* Alerts */}
      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-xs font-bold text-emerald-700">Dismiss</button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold text-rose-700">Dismiss</button>
        </div>
      )}

      {/* Preview Mode */}
      {isPreview ? (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-xs text-purple-900 font-medium">
            👁️ <strong>Student View Preview:</strong> Below is how enrolled students will experience this proctored quiz inside their portal.
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {q.q || 'Untitled Question'}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400">({q.points || 20} pts)</span>
                </div>

                <div className="space-y-2 pl-8">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${
                        optIdx === q.correct
                          ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input type="radio" checked={optIdx === q.correct} readOnly className="w-4 h-4 text-emerald-600" />
                      <span>{opt}</span>
                      {optIdx === q.correct && (
                        <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Correct Answer Choice
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Edit Mode: Google Form Question Cards */
        <div className="space-y-5">
          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-4 relative group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Question #{qIdx + 1}
                </span>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    Points:
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={q.points || 20}
                      onChange={(e) => updatePoints(qIdx, e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </label>

                  <button
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text Prompt */}
              <label className="block text-xs font-bold text-slate-700">
                Question Prompt / Statement *
                <input
                  type="text"
                  value={q.q}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  placeholder="e.g. Which hook executes side-effects in React?"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                />
              </label>

              {/* Multiple Choice Options List */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Multiple Choice Options (Select radio for correct answer)
                </label>

                {q.options.map((optText, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correct === optIdx}
                      onChange={() => setCorrectOption(qIdx, optIdx)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Mark as correct answer choice"
                    />

                    <input
                      type="text"
                      value={optText}
                      onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className={`flex-1 rounded-xl border p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        q.correct === optIdx ? 'border-emerald-400 bg-emerald-50/40 font-semibold' : 'border-slate-200 bg-white'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => removeOption(qIdx, optIdx)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition"
                      title="Remove Option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option Choice
                </button>
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            onClick={addQuestion}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Question Block
          </button>
        </div>
      )}
    </div>
  );
}
