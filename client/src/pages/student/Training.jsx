import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingService } from '../../services/trainingService';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  Sparkles,
  X,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Search,
  Lock
} from 'lucide-react';

// Domain-tailored assessment question banks (Automated, un-biasable evaluation)
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
  ],
  'DevOps': [
    {
      q: 'What does CI/CD stand for in modern software engineering practices?',
      options: ['Continuous Integration & Continuous Delivery/Deployment', 'Central Infrastructure & Code Development', 'Cloud Inspection & Container Distribution', 'Control Interface & Data Design'],
      correct: 0,
    },
    {
      q: 'Which configuration management file specifies container image build layers?',
      options: ['package.json', 'Dockerfile', 'nginx.conf', 'pom.xml'],
      correct: 1,
    },
    {
      q: 'What is the primary role of Prometheus in a DevOps ecosystem?',
      options: ['Source code management', 'Monitoring and alert generation for system metrics', 'Database migration execution', 'DNS routing'],
      correct: 1,
    },
    {
      q: 'Which Git branching strategy is commonly used for isolating feature development?',
      options: ['Git Flow / Feature Branching', 'Direct Commits to Main', 'Force Pushing', 'Rebasing Production'],
      correct: 0,
    },
    {
      q: 'Which tool automates continuous integration build and test pipelines?',
      options: ['Jenkins / GitHub Actions', 'Redis', 'Docker Compose', 'Postman'],
      correct: 0,
    },
  ],
  'Aptitude': [
    {
      q: 'If a train traveling at 60 km/h passes a pole in 9 seconds, what is the length of the train?',
      options: ['120 meters', '150 meters', '180 meters', '200 meters'],
      correct: 1,
    },
    {
      q: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
      options: ['36', '40', '42', '48'],
      correct: 2,
    },
    {
      q: 'A product is sold for $240 with a 20% profit margin. What was the original cost price?',
      options: ['$180', '$200', '$210', '$220'],
      correct: 1,
    },
    {
      q: 'If 6 workers can build a wall in 10 days, how many days will 4 workers take at the same pace?',
      options: ['12 days', '15 days', '18 days', '20 days'],
      correct: 1,
    },
    {
      q: 'What is the average of numbers 15, 25, 35, 45, and 55?',
      options: ['30', '35', '40', '45'],
      correct: 1,
    },
  ],
  'Interview Preparation': [
    {
      q: 'When asked "Tell me about a time you faced a technical challenge", what framework delivers the clearest answer?',
      options: ['STAR Method (Situation, Task, Action, Result)', 'BLUF Method (Bottom Line Up Front)', 'FIFO Method', 'SWOT Analysis'],
      correct: 0,
    },
    {
      q: 'What is the main objective of a System Design interview?',
      options: ['Write syntactically perfect code in C++', 'Architect scalable, reliable, and fault-tolerant system components', 'Memorize algorithm complexity tables', 'Debug CSS flexbox properties'],
      correct: 1,
    },
    {
      q: 'How should you answer "What is your biggest weakness?" in a technical interview?',
      options: ['Say you have no weaknesses', 'Mention a real technical area you are actively improving with concrete action steps', 'Complain about past employers', 'Give a fake answer like "I work too hard"'],
      correct: 1,
    },
    {
      q: 'What is the first step when solving a coding problem during a technical interview?',
      options: ['Immediately start writing code', 'Clarify requirements, constraints, and test edge cases with the interviewer', 'Ask for the answer', 'Write unit tests in HTML'],
      correct: 1,
    },
    {
      q: 'Why do employers conduct behavioral interviews?',
      options: ['To test typing speed', 'To evaluate culture fit, communication, adaptability, and problem-solving mindset', 'To check resume font size', 'To test internet connection'],
      correct: 1,
    },
  ],
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

function getQuestionsForProgram(program) {
  if (Array.isArray(program?.quizQuestions) && program.quizQuestions.length > 0) {
    return program.quizQuestions;
  }
  if (QUESTION_BANK[program.domain]) return QUESTION_BANK[program.domain];
  const matchedKey = Object.keys(QUESTION_BANK).find((key) =>
    program.domain.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(program.domain.toLowerCase())
  );
  return matchedKey ? QUESTION_BANK[matchedKey] : DEFAULT_QUESTIONS;
}

export default function StudentTraining() {
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Assessment State
  const [activeQuizProgram, setActiveQuizProgram] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Active Certificate Modal State
  const [selectedCert, setSelectedCert] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [programResult, enrollmentResult] = await Promise.all([
        trainingService.list({ search, mode: mode || undefined }),
        trainingService.enrollments()
      ]);
      setPrograms(programResult.programs || []);
      setEnrollments(enrollmentResult.enrollments || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Training programs could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, mode]);

  const enrollmentByProgram = useMemo(
    () => new Map(enrollments.map((item) => [item.programId, item])),
    [enrollments]
  );

  const act = async (id, operation) => {
    setBusy(id);
    setMessage('');
    setError('');
    try {
      const result = await operation();
      setMessage(result.message);
      await load();
      return result;
    } catch (err) {
      setError(err.response?.data?.error || 'That action could not be completed.');
      throw err;
    } finally {
      setBusy('');
    }
  };

  const handleStartQuiz = (program) => {
    setActiveQuizProgram(program);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const handleOptionSelect = (qIndex, optionIndex) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizProgram) return;
    const questions = getQuestionsForProgram(activeQuizProgram);
    
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    const passed = calculatedScore >= 60;

    setQuizResult({
      score: calculatedScore,
      correctCount,
      totalCount: questions.length,
      passed
    });
    setQuizSubmitted(true);

    if (passed) {
      try {
        await act(activeQuizProgram.id, () =>
          trainingService.complete(activeQuizProgram.id, calculatedScore)
        );
      } catch (err) {
        console.error('Quiz submission API error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Employer Verified Skills
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
            Skill Development & Training Programs
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Build industry-aligned technical and soft skills. Complete proctored assessments to earn verified certificates and automatically add skill evidence to your student profile.
          </p>
        </div>
      </header>

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Filter Controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="training-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search training programs or target skills..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
          <select
            id="training-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          >
            <option value="">All delivery modes</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
            <option value="OFFLINE">In person</option>
          </select>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Available Programs
          </h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {programs.length} {programs.length === 1 ? 'program' : 'programs'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading training catalog...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">No programs match your search.</p>
            <p>Try clearing your search query or selecting a different delivery mode.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {programs.map((program) => {
              const enrollment = enrollmentByProgram.get(program.id);
              const isBusy = busy === program.id;

              return (
                <article
                  key={program.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {program.domain}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {program.title}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {program.mode}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {program.format}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {program.provider}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {program.durationWeeks} weeks
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {program.skillsCovered.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100">
                    {enrollment?.status === 'COMPLETED' && enrollment?.certificateCode ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Completed · {enrollment.score}% Score
                          </div>
                          <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                            ID: {enrollment.certificateCode}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCert(enrollment)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          View Certificate
                        </button>
                      </div>
                    ) : !enrollment ? (
                      <button
                        disabled={isBusy}
                        onClick={() =>
                          act(program.id, () => trainingService.enroll(program.id))
                        }
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span>{isBusy ? 'Enrolling...' : 'Enroll in Program'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-indigo-600" />
                            Proctored Exam & Capstone Submission
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            enrollment.status === 'APPROVED_FOR_EXAM' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {enrollment.status === 'APPROVED_FOR_EXAM' ? 'Clearance Granted' : 'Approval Required'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {program.assessmentType || 'Requires Instructor Clearance, Project Upload, and 60% Exam Pass'}
                        </p>
                        <Link
                          to={`/student/training/${program.id}/exam`}
                          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 text-xs transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Go to Standalone Exam & Project Page</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Learning Record Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              My Learning Record & Certificates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified certifications automatically attached to your student profile
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {enrollments.length} enrolled
          </span>
        </div>

        {enrollments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">
            You have not enrolled in any training programs yet. Browse the catalog above to get started.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrollments.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:bg-slate-50/50 px-2 rounded-xl transition"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.programTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enrolled on {new Date(item.enrolledAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'COMPLETED' && item.certificateCode
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'AWAITING_APPROVAL' || item.projectUrl
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status === 'COMPLETED' && item.certificateCode
                      ? `Completed · ${item.score}%`
                      : item.status === 'AWAITING_APPROVAL' || item.projectUrl
                      ? 'Submitted · Awaiting Provider Evaluation'
                      : 'In Progress'}
                  </span>

                  {item.status === 'COMPLETED' && item.certificateCode && (
                    <button
                      onClick={() => setSelectedCert(item)}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Certificate</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PROCTORED SKILL ASSESSMENT QUIZ MODAL */}
      {activeQuizProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Skill Assessment Quiz · {activeQuizProgram.domain}
                </span>
                <h3 className="text-lg font-bold font-display">{activeQuizProgram.title}</h3>
              </div>
              <button
                onClick={() => setActiveQuizProgram(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {!quizSubmitted ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Proctored Skill Verification</p>
                      <p className="mt-0.5 text-blue-800">
                        Answer all 5 questions. A score of 60% or higher is required to earn the official completion certificate and add skill evidence to your profile.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {getQuestionsForProgram(activeQuizProgram).map((qObj, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          {qObj.q}
                        </p>

                        <div className="space-y-2 pl-7">
                          {qObj.options.map((optionText, optIdx) => {
                            const isSelected = userAnswers[qIdx] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                onClick={() => handleOptionSelect(qIdx, optIdx)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-500 font-semibold text-blue-950'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${qIdx}`}
                                  checked={isSelected}
                                  onChange={() => handleOptionSelect(qIdx, optIdx)}
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
                </>
              ) : (
                /* QUIZ RESULT SCREEN */
                <div className="text-center py-6 space-y-4">
                  {quizResult?.passed ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900">
                          Assessment Passed! ({quizResult.score}%)
                        </h3>
                        <p className="text-xs text-slate-600">
                          You answered {quizResult.correctCount} out of {quizResult.totalCount} questions correctly.
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 text-left space-y-2 max-w-md mx-auto">
                        <div className="flex items-center gap-2 font-bold text-emerald-950">
                          <Award className="w-4 h-4 text-emerald-600" />
                          Certificate Issued & Skills Verified
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Your official certificate code has been generated and your student profile has been updated with verified skill endorsements!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                        ✕
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900">
                          Assessment Not Passed ({quizResult.score}%)
                        </h3>
                        <p className="text-xs text-slate-600">
                          You answered {quizResult.correctCount} out of {quizResult.totalCount} questions correctly. A score of at least 60% is required.
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 text-left space-y-1 max-w-md mx-auto">
                        <p className="font-bold">Next Steps:</p>
                        <p className="text-[11px]">
                          Review the course modules and try the assessment again when you feel ready.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {!quizSubmitted
                  ? `${Object.keys(userAnswers).length} of ${
                      getQuestionsForProgram(activeQuizProgram).length
                    } answered`
                  : quizResult?.passed
                  ? 'Evaluation Complete'
                  : 'Retry Available'}
              </span>

              {!quizSubmitted ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveQuizProgram(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      Object.keys(userAnswers).length <
                      getQuestionsForProgram(activeQuizProgram).length
                    }
                    onClick={handleSubmitQuiz}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    Submit Assessment & Grade
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveQuizProgram(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Close Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL PROVIDER-ISSUED CERTIFICATE MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden">
            {/* Header: Provider Branding */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white p-6 relative">
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg border border-amber-300/40">
                  <Award className="w-7 h-7 text-slate-950" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Official Provider Issued Certificate
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mt-1">
                    {programs.find((p) => p.id === selectedCert.programId)?.provider || 'Global Skill Partner Organization'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Certificate Body: Provider Document Layout */}
            <div className="p-8 text-center space-y-6 bg-slate-50/70">
              <div className="border-8 border-double border-amber-700/20 p-8 rounded-2xl bg-white space-y-5 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 text-amber-500/10 pointer-events-none">
                  <Award className="w-32 h-32" />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Official Credential of Professional Competency
                  </p>
                  <h4 className="text-2xl font-bold font-display text-slate-900 leading-tight">
                    {selectedCert.programTitle}
                  </h4>
                </div>

                <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full" />

                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  This official training certificate is formally issued and verified by <strong className="text-slate-900 font-bold">{programs.find((p) => p.id === selectedCert.programId)?.provider || 'Skill Provider Organization'}</strong> to confirm successful completion of all curriculum modules, capstone project submission, and proctored technical evaluation with a score of <strong className="text-emerald-700 font-bold">{selectedCert.score}%</strong>.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-left text-xs bg-slate-50 p-4 rounded-xl font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-bold">Provider Serial Code</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedCert.certificateCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-bold">Issue Date</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {new Date(selectedCert.completedAt || selectedCert.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3">
              <a
                href={`https://credentials.pfac-portal.edu/certificates/verify/${selectedCert.certificateCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
              >
                <span>Open Provider Certificate Document ↗</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedCert(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
