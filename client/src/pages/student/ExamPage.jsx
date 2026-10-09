import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainingService } from '../../services/trainingService';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileCode2,
  FileCheck,
  FolderGit2,
  GraduationCap,
  HelpCircle,
  Lock,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const QUESTION_BANK = {
  'React Development': [
    {
      q: 'Which React Hook is designed to perform side effects such as data fetching or DOM subscriptions?',
      options: ['useState', 'useRef', 'useEffect', 'useMemo'],
      correct: 2,
    },
    {
      q: 'How does React optimize UI re-rendering when state changes occur?',
      options: ['Directly mutates browser DOM', 'Uses Virtual DOM reconciliation diffing', 'Reloads the entire webpage', 'Compiles JSX into static HTML files'],
      correct: 1,
    },
    {
      q: 'What is the primary function of `useMemo` in React?',
      options: ['Saves component state to localStorage', 'Memoizes expensive calculation results across re-renders', 'Triggers HTTP network requests', 'Renders modal components'],
      correct: 1,
    },
    {
      q: 'In React Router v6, which hook retrieves URL query parameters?',
      options: ['useParams', 'useSearchParams', 'useLocation', 'useNavigate'],
      correct: 1,
    },
    {
      q: 'Why should unique `key` props be provided when rendering lists in React?',
      options: ['To style individual list items with CSS', 'To help React identify which items have changed, been added, or removed', 'To bind click handlers to items', 'To enable server-side rendering'],
      correct: 1,
    },
  ],
  'Python Full Stack': [
    {
      q: 'In Django ORM, which method retrieves a single record matching given query parameters?',
      options: ['filter()', 'all()', 'get()', 'select()'],
      correct: 2,
    },
    {
      q: 'What is the function of the `yield` keyword inside a Python function?',
      options: ['Terminates execution and returns a tuple', 'Transforms the function into a generator object', 'Raises a custom RuntimeException', 'Defines an async event loop'],
      correct: 1,
    },
    {
      q: 'Which HTTP status code signifies that a POST request successfully created a new resource?',
      options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
      correct: 1,
    },
    {
      q: 'What is the average time complexity for key lookup in a Python dictionary (`dict`)?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
      correct: 2,
    },
    {
      q: 'Which tool creates isolated Python virtual environments for project dependencies?',
      options: ['pip', 'virtualenv / venv', 'pytest', 'gunicorn'],
      correct: 1,
    },
  ],
  'AI/ML': [
    {
      q: 'Which metric best evaluates a classification model operating on heavily imbalanced datasets?',
      options: ['Accuracy', 'F1-Score / Precision-Recall', 'Mean Squared Error', 'R-Squared'],
      correct: 1,
    },
    {
      q: 'What is the primary purpose of activation functions in Neural Networks?',
      options: ['Normalize input data tensors', 'Introduce non-linearity to learn complex patterns', 'Prevent memory leakage', 'Accelerate CPU clock speed'],
      correct: 1,
    },
    {
      q: 'What problem does L2 Regularization (Ridge) prevent in machine learning models?',
      options: ['Underfitting by increasing bias', 'Overfitting by penalizing large model weights', 'Data leakage during splitting', 'Vanishing gradients in RNNs'],
      correct: 1,
    },
    {
      q: 'In PyTorch, which method computes the gradient of loss with respect to graph parameters?',
      options: ['loss.backward()', 'optimizer.step()', 'torch.no_grad()', 'loss.item()'],
      correct: 0,
    },
    {
      q: 'Which algorithm is a popular supervised ensemble method for classification and regression tasks?',
      options: ['K-Means Clustering', 'Random Forest / Gradient Boosting', 'DBSCAN', 'PCA'],
      correct: 1,
    },
  ],
  'Data Science': [
    {
      q: 'In Pandas, which function merges two DataFrames on a common column or index?',
      options: ['pd.concat()', 'pd.merge()', 'df.append()', 'df.groupby()'],
      correct: 1,
    },
    {
      q: 'What type of chart is best suited for showing distributions of a single numerical variable?',
      options: ['Scatter Plot', 'Bar Chart', 'Histogram', 'Line Chart'],
      correct: 2,
    },
    {
      q: 'Which SQL clause aggregates records after applying grouping criteria?',
      options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
      correct: 1,
    },
    {
      q: 'What is the purpose of Data Normalization (e.g., MinMax Scaling)?',
      options: ['Removes duplicate rows from datasets', 'Scales feature values into a uniform range (0 to 1)', 'Imputes missing values with column means', 'Converts categorical values to numbers'],
      correct: 1,
    },
    {
      q: 'Which library is standard in Python for data manipulation and numerical arrays?',
      options: ['NumPy & Pandas', 'Flask & Express', 'Requests & BeautifulSoup', 'Celery & Redis'],
      correct: 0,
    },
  ],
  'Cybersecurity': [
    {
      q: 'What type of vulnerability occurs when unvalidated user input is directly concatenated into database queries?',
      options: ['Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'CSRF', 'Buffer Overflow'],
      correct: 1,
    },
    {
      q: 'Which cryptographic protocol secures web browser communication via SSL/TLS?',
      options: ['HTTP', 'HTTPS', 'FTP', 'SNMP'],
      correct: 1,
    },
    {
      q: 'What security principle dictates giving users only the minimal access permissions needed for their role?',
      options: ['Principle of Open Access', 'Principle of Least Privilege', 'Multi-Factor Authentication', 'Zero-Trust Architecture'],
      correct: 1,
    },
    {
      q: 'What is a Zero-Day vulnerability?',
      options: ['A security bug that takes 0 days to fix', 'A security flaw unknown to the vendor with no official patch available', 'An expired SSL certificate', 'A trial period for firewall software'],
      correct: 1,
    },
    {
      q: 'Which tool is widely used for network packet analysis and troubleshooting?',
      options: ['Wireshark', 'Metasploit', 'Nmap', 'Burp Suite'],
      correct: 0,
    },
  ],
  'Cloud Computing': [
    {
      q: 'Which AWS cloud service provides object storage with high availability and scalability?',
      options: ['Amazon EC2', 'Amazon S3', 'Amazon RDS', 'Amazon EBS'],
      correct: 1,
    },
    {
      q: 'In Docker, what command runs a container from an image instance?',
      options: ['docker build', 'docker run', 'docker push', 'docker exec'],
      correct: 1,
    },
    {
      q: 'What is the smallest deployable object in Kubernetes architecture?',
      options: ['Cluster', 'Node', 'Pod', 'Service'],
      correct: 2,
    },
    {
      q: 'What benefit does Serverless computing (e.g., AWS Lambda) provide?',
      options: ['Eliminates need to provision or manage underlying server infrastructure', 'Replaces SQL databases with files', 'Guarantees 0ms network latency', 'Runs without internet access'],
      correct: 0,
    },
    {
      q: 'Which tool allows provisioning cloud infrastructure using declarative configuration files?',
      options: ['Terraform', 'Jenkins', 'Git', 'Prometheus'],
      correct: 0,
    },
  ]
};

const DEFAULT_QUESTIONS = [
  {
    q: 'What is the primary purpose of writing automated unit tests in software development?',
    options: ['To slow down release schedules', 'To verify that individual components function correctly and prevent regressions', 'To make source code files larger', 'To replace user interface design'],
    correct: 1,
  },
  {
    q: 'Which HTTP method is idempotent and intended for updating an existing resource?',
    options: ['POST', 'PUT', 'DELETE', 'GET'],
    correct: 1,
  },
  {
    q: 'In software design, what does the Single Responsibility Principle state?',
    options: ['A class should have only one reason to change', 'Every program should have only one file', 'Only one developer should edit a repository', 'Functions must take only one parameter'],
    correct: 0,
  },
  {
    q: 'What is the main purpose of a database index?',
    options: ['Encrypts confidential database tables', 'Significantly speeds up data retrieval queries', 'Creates duplicate table backups', 'Formats query output into HTML'],
    correct: 1,
  },
  {
    q: 'Which architecture pattern decouples front-end user interfaces from back-end business logic?',
    options: ['Monolithic single file', 'Client-Server / REST API', 'Spreadsheet macros', 'Static file copier'],
    correct: 1,
  },
];

function getQuestions(program) {
  if (!program) return DEFAULT_QUESTIONS;
  if (QUESTION_BANK[program.domain]) return QUESTION_BANK[program.domain];
  const key = Object.keys(QUESTION_BANK).find((k) =>
    program.domain.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(program.domain.toLowerCase())
  );
  return key ? QUESTION_BANK[key] : DEFAULT_QUESTIONS;
}

export default function StudentExamPage() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Project Submission Form State
  const [projectTitle, setProjectTitle] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Quiz State
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await trainingService.details(programId);
      setProgram(data.program);
      setEnrollment(data.enrollment);
      if (data.program) {
        setProjectTitle(`${data.program.title} Capstone Project`);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [programId]);

  const handleRequestClearance = async () => {
    setActionBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await trainingService.requestPermission(programId);
      setMessage(res.message);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request exam clearance.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleGrantClearance = async () => {
    setActionBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await trainingService.approvePermission(programId);
      setMessage(res.message);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not grant exam permission.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (result) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitExamAndProject = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!projectTitle.trim() || !projectUrl.trim()) {
      setError('Please provide both a Project Title and a valid Repository/Live Demo URL.');
      return;
    }

    const questions = getQuestions(program);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) correctCount += 1;
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    const passed = calculatedScore >= 60;

    if (!passed) {
      setResult({
        score: calculatedScore,
        correctCount,
        totalCount: questions.length,
        passed: false
      });
      setError(`Score is ${calculatedScore}%. A score of at least 60% is required to earn the certificate. Please review your answers and retry.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await trainingService.completeWithProject(programId, {
        score: calculatedScore,
        projectTitle: projectTitle.trim(),
        projectUrl: projectUrl.trim(),
        projectDescription: projectDescription.trim()
      });

      setResult({
        score: calculatedScore,
        correctCount,
        totalCount: questions.length,
        passed: true,
        certificate: res.certificate,
        project: res.project
      });
      setMessage('Congratulations! You passed the examination and your project deliverable has been verified.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit exam and project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading Exam & Clearance Interface...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Program Not Found</h2>
        <p className="text-xs text-slate-500">The training program you are looking for does not exist or has been removed.</p>
        <Link to="/student/training" className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition">
          Return to Training Hub
        </Link>
      </div>
    );
  }

  const isApproved = enrollment?.status === 'APPROVED_FOR_EXAM' || enrollment?.status === 'COMPLETED';
  const isCompleted = enrollment?.status === 'COMPLETED';
  const questions = getQuestions(program);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/student/training" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
          <ChevronLeft className="w-4 h-4" /> Back to Skill Training Programs
        </Link>

        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Domain: {program.domain}
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-2xl shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Dedicated Assessment & Capstone Submission
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-white">{program.title}</h1>
          <p className="text-xs md:text-sm text-slate-300">
            Issued by <strong className="text-white">{program.provider}</strong> · {program.durationWeeks} Weeks Duration
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 font-bold">Dismiss</button>
        </div>
      )}

      {/* COMPLETED CERTIFICATE BANNER */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-xl space-y-5 border border-emerald-500/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center text-2xl font-bold border border-amber-400/40">
              <Award className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Official Certificate Issued by {program.provider}
              </span>
              <h2 className="text-xl font-bold font-display text-white">Provider Training Certificate Issued!</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 bg-white/10 p-4 rounded-xl text-xs backdrop-blur-sm">
            <div>
              <span className="text-slate-300 block text-[11px] font-bold uppercase">Provider Serial Code:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{enrollment.certificateCode}</span>
            </div>
            <div>
              <span className="text-slate-300 block text-[11px] font-bold uppercase">Exam Pass Score:</span>
              <span className="font-bold text-white text-sm">{enrollment.score}% Verified</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={`https://credentials.pfac-portal.edu/certificates/verify/${enrollment.certificateCode}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
            >
              <span>Open Provider Certificate Document ↗</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/student/profile"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>View Credential on Profile</span>
            </Link>
          </div>
        </div>
      )}

      {/* STEP 1: EXAM PERMISSION & CLEARANCE CARD */}
      {!isApproved && !isCompleted && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Requirement 1 of 2 · Instructor Clearance
              </span>
              <h3 className="text-lg font-bold text-slate-900">Skill Provider Authorization Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Before attempting the final skill assessment exam and submitting your project deliverable, your Skill Provider / Instructor must review your course progress and grant exam clearance.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Clearance Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                enrollment?.status === 'AWAITING_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {enrollment?.status === 'AWAITING_APPROVAL' ? 'Clearance Request Pending Approval' : 'Not Yet Requested'}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                disabled={actionBusy || enrollment?.status === 'AWAITING_APPROVAL'}
                onClick={handleRequestClearance}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{enrollment?.status === 'AWAITING_APPROVAL' ? 'Clearance Requested' : 'Request Exam Clearance'}</span>
              </button>

              <button
                disabled={actionBusy}
                onClick={handleGrantClearance}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Grant Clearance (Provider / Dev Override)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: PROJECT SUBMISSION & PROCTORED EXAM FORM */}
      {(isApproved || isCompleted) && (
        <form onSubmit={handleSubmitExamAndProject} className="space-y-6">
          {/* PROJECT SUBMISSION SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Mandatory Submission Requirement
                </span>
                <h3 className="text-base font-bold text-slate-900">Capstone Project Deliverable</h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isCompleted}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  placeholder="e.g., E-Commerce Microservices & React Architecture"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Project Repository / Live Demo URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <ExternalLink className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    required
                    disabled={isCompleted}
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    placeholder="https://github.com/username/project-repo or https://my-demo.app"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Key Technical Features & Architecture Summary
                </label>
                <textarea
                  rows={3}
                  disabled={isCompleted}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  placeholder="Briefly describe key frameworks, database choices, state management, and deployment pipelines implemented..."
                />
              </div>
            </div>
          </div>

          {/* EXAMINATION SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Proctored Evaluation
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Skill Competency Assessment Exam</h3>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Pass Mark: 60%
              </span>
            </div>

            <div className="space-y-6">
              {questions.map((qObj, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <p className="text-xs font-bold text-slate-900 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <span>{qObj.q}</span>
                  </p>

                  <div className="space-y-2 pl-7">
                    {qObj.options.map((optionText, optIdx) => {
                      const isSelected = userAnswers[qIdx] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => !isCompleted && handleOptionSelect(qIdx, optIdx)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition ${
                            isCompleted
                              ? optIdx === qObj.correct
                                ? 'bg-emerald-50 border-emerald-400 font-semibold text-emerald-950'
                                : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-600'
                              : isSelected
                              ? 'bg-blue-50 border-blue-500 font-semibold text-blue-950 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer'
                          }`}
                        >
                          <input
                            type="radio"
                            disabled={isCompleted}
                            name={`question-${qIdx}`}
                            checked={isSelected}
                            onChange={() => !isCompleted && handleOptionSelect(qIdx, optIdx)}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          <span>{optionText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* SUBMIT BUTTON */}
            {!isCompleted && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {Object.keys(userAnswers).length} of {questions.length} questions answered
                </span>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    Object.keys(userAnswers).length < questions.length ||
                    !projectTitle.trim() ||
                    !projectUrl.trim()
                  }
                  className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <span>{submitting ? 'Evaluating & Verifying...' : 'Submit Exam & Project Deliverable'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
