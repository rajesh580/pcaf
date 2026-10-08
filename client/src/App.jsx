import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Search from './pages/Search';
import Settings from './pages/Settings';

// Student Persona Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentSkills from './pages/student/Skills';
import StudentResume from './pages/student/Resume';
import StudentInternships from './pages/student/Internships';
import StudentJobs from './pages/student/Jobs';
import StudentApplications from './pages/student/Applications';
import StudentRecommendations from './pages/student/Recommendations';
import SkillMatch from './pages/student/SkillMatch';
import StandardizedResume from './pages/student/StandardizedResume';
import StudentTraining from './pages/student/Training';
import StudentCareerReport from './pages/student/CareerReport';

// College Persona Pages
import CollegeDashboard from './pages/college/Dashboard';
import CollegeDepartments from './pages/college/Departments';
import CollegeReports from './pages/college/Reports';

// Company Persona Pages
import CompanyDashboard from './pages/company/Dashboard';
import CompanyRecruitment from './pages/company/Recruitment';
import CompanyReports from './pages/company/Reports';
import SkillProviderDashboard from './pages/company/SkillProviderDashboard';

// Admin Persona Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCompanyDetail from './pages/admin/CompanyDetail';
import AdminCollegeDetail from './pages/admin/CollegeDetail';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="search" element={<Search />} />
          <Route path="settings" element={<Settings />} />

          {/* Student Persona Routes */}
          <Route path="dashboard/student" element={<StudentDashboard />} />
          <Route path="student/profile" element={<StudentProfile />} />
          <Route path="student/skills" element={<StudentSkills />} />
          <Route path="student/resume" element={<StudentResume />} />
          <Route path="student/standardized-resume" element={<StandardizedResume />} />
          <Route path="student/internships" element={<StudentInternships />} />
          <Route path="student/jobs" element={<StudentJobs />} />
          <Route path="student/applications" element={<StudentApplications />} />
          <Route path="student/recommendations" element={<StudentRecommendations />} />
          <Route path="student/skill-match" element={<SkillMatch />} />
          <Route path="student/training" element={<StudentTraining />} />
          <Route path="student/report" element={<StudentCareerReport />} />

          {/* College Persona Routes */}
          <Route path="dashboard/college" element={<CollegeDashboard />} />
          <Route path="college/departments" element={<CollegeDepartments />} />
          <Route path="college/reports" element={<CollegeReports />} />

          {/* Company Persona Routes */}
          <Route path="dashboard/company" element={<CompanyDashboard />} />
          <Route path="company/recruitment" element={<CompanyRecruitment />} />
          <Route path="company/reports" element={<CompanyReports />} />

          {/* Skill Provider Persona */}
          <Route path="dashboard/skill-provider" element={<SkillProviderDashboard />} />

          {/* Admin Persona Routes */}
          <Route path="dashboard/admin" element={<AdminDashboard />} />
          <Route path="admin/colleges/:collegeId" element={<AdminCollegeDetail />} />
          <Route path="admin/companies/:companyId" element={<AdminCompanyDetail />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
