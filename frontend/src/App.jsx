import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Admin Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageCourses from './pages/admin/ManageCourses';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManageStudents from './pages/admin/ManageStudents';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentResults from './pages/student/StudentResults';

// Shared Pages
import ReportsDashboard from './pages/reports/ReportsDashboard';
import TimetableView from './pages/common/TimetableView';
import AnnouncementsView from './pages/common/AnnouncementsView';

const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'FACULTY') return <Navigate to="/faculty" replace />;
  if (role === 'STUDENT') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ADMIN Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<ManageDepartments />} />
        <Route path="/admin/faculty" element={<ManageFaculty />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/subjects" element={<ManageSubjects />} />
        <Route path="/admin/timetable" element={<ManageTimetable />} />
        <Route path="/admin/announcements" element={<ManageAnnouncements />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/reports" element={<ReportsDashboard />} />
      </Route>

      {/* FACULTY Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']} />}>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/students" element={<ManageStudents />} />
        <Route path="/faculty/timetable" element={<TimetableView />} />
        <Route path="/faculty/announcements" element={<AnnouncementsView />} />
        <Route path="/faculty/attendance" element={<FacultyAttendance />} />
        <Route path="/faculty/marks" element={<FacultyMarks />} />
        <Route path="/faculty/reports" element={<ReportsDashboard />} />
      </Route>

      {/* STUDENT Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/timetable" element={<TimetableView />} />
        <Route path="/student/announcements" element={<AnnouncementsView />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/results" element={<StudentResults />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
