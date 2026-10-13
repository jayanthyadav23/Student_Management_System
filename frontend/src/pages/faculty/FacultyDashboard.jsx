import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi';
import { studentApi } from '../../api/studentApi';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  CalendarCheck,
  Award,
  Users2,
  Building2,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Calendar,
  Megaphone,
  GraduationCap,
  Filter,
  Search,
  Lock,
  RefreshCw,
  Eye,
  ShieldCheck,
  Clock
} from 'lucide-react';

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Department Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');

  // Selected student details modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { user } = useAuth();
  const { showError } = useToast();

  const fetchAssignedCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await attendanceApi.getAssignedCourses();
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load assigned courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchDepartmentStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const params = {
        page,
        size: 8,
        sortBy: 'name',
        sortDir: 'asc',
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCourseFilter) params.courseId = selectedCourseFilter;
      if (semesterFilter) params.semester = semesterFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (academicYearFilter) params.academicYear = academicYearFilter;

      const res = await studentApi.getAllStudents(params);
      if (res.success && res.data) {
        setStudents(res.data.content || []);
        setTotalStudentsCount(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load department students.');
    } finally {
      setLoadingStudents(false);
    }
  }, [page, search, selectedCourseFilter, semesterFilter, sectionFilter, academicYearFilter, showError]);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    fetchDepartmentStudents();
  }, [fetchDepartmentStudents]);

  if (loadingCourses && courses.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading faculty dashboard..." size="lg" />
      </div>
    );
  }

  const facultyDepartmentName = courses.length > 0
    ? courses[0].departmentName
    : (user?.departmentName || 'Your Department');

  const totalCourseRegistrations = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-teal-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Faculty Academic Portal • {facultyDepartmentName}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Professor'}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Manage student attendance, evaluate semester grades, inspect department rosters, and supervise course progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/faculty/attendance"
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              Take Attendance
            </Link>
            <Link
              to="/faculty/marks"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
            >
              <Award className="w-4 h-4" />
              Grade Students
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          to="/faculty/students"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Students</div>
            <div className="text-[11px] text-slate-400">Directory & records</div>
          </div>
        </Link>

        <Link
          to="/faculty/timetable"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Timetable</div>
            <div className="text-[11px] text-slate-400">Class timings</div>
          </div>
        </Link>

        <Link
          to="/faculty/announcements"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Notices</div>
            <div className="text-[11px] text-slate-400">Campus alerts</div>
          </div>
        </Link>

        <Link
          to="/faculty/attendance"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Daily Attendance</div>
            <div className="text-[11px] text-slate-400">Session marking</div>
          </div>
        </Link>

        <Link
          to="/faculty/marks"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Grade Entry</div>
            <div className="text-[11px] text-slate-400">Exam marks</div>
          </div>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Courses"
          value={courses.length}
          icon={BookOpen}
          color="indigo"
          subtext="Active teaching load"
        />
        <StatCard
          title="Course Registrations"
          value={totalCourseRegistrations}
          icon={Users2}
          color="emerald"
          subtext="Enrolled across your courses"
        />
        <StatCard
          title="Department Students"
          value={totalStudentsCount}
          icon={Building2}
          color="amber"
          subtext={`Enrolled in ${facultyDepartmentName}`}
        />
      </div>

      {/* Section 1: Assigned Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Courses</h2>
            <p className="text-xs text-slate-500">
              Only courses assigned to you are listed. Select a course to record attendance or evaluate marks.
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <EmptyState
              title="No courses assigned yet"
              description="An administrator has not assigned any courses to your faculty account for this semester."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                      {course.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Sem {course.semester} • {course.credits} Credits
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {course.description || 'Core departmental syllabus module.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {course.departmentName}
                    </span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {course.enrollmentCount ?? 0} Students
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <Link
                    to={`/faculty/attendance?courseId=${course.id}`}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors text-center"
                    title="Take Attendance"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </Link>
                  <Link
                    to={`/faculty/marks?courseId=${course.id}`}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors text-center"
                    title="Enter Marks"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Marks</span>
                  </Link>
                  <Link
                    to={`/faculty/reports?courseId=${course.id}`}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors text-center"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Reports</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Department Students Directory */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Department Students Directory</h2>
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-200">
                {facultyDepartmentName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Displaying all registered students belonging to your department. Use filters to narrow by course, semester, section, or academic year.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDepartmentStudents}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              title="Refresh roster"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStudents ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/faculty/students"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
          {/* Department (Locked) */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Department
            </label>
            <div
              className="w-full px-3 py-2 text-xs bg-slate-200/70 border border-slate-300 rounded-xl text-slate-700 font-semibold truncate cursor-not-allowed"
              title="Department is locked to your faculty assignment"
            >
              {facultyDepartmentName}
            </div>
          </div>

          {/* Assigned Course Filter */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Course Enrollment</label>
            <select
              value={selectedCourseFilter}
              onChange={(e) => {
                setSelectedCourseFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
            >
              <option value="">All Assigned Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.title})
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Academic Year</label>
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-medium"
            >
              <option value="">All Years</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Name or roll..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          {loadingStudents ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Filtering department students..." size="md" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState
                title="No students match the criteria"
                description="Try clearing or adjusting the course, semester, section, or search filters above."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Semester & Sec</th>
                  <th className="px-5 py-3.5 text-center">Course Enrolled</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                        {st.rollNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {st.departmentName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700">
                      Sem {st.semester} • Sec {st.section || 'A'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {st.enrolledCoursesCount || 0} Courses
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          st.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {st.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(st)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <div>
              Page {page + 1} of {totalPages} ({totalStudentsCount} students)
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedStudent.rollNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Department</span>
                <span className="font-bold text-slate-800">{selectedStudent.departmentName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Semester & Section</span>
                <span className="font-bold text-slate-800">
                  Semester {selectedStudent.semester} (Sec {selectedStudent.section || 'A'})
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Academic Year</span>
                <span className="font-bold text-slate-800">{selectedStudent.academicYear || '2025-2026'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Account Email</span>
                <span className="font-bold text-slate-800 truncate block">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Phone Contact</span>
                <span className="font-bold text-slate-800">{selectedStudent.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Enrolled Courses</span>
                <span className="font-bold text-indigo-600">{selectedStudent.enrolledCoursesCount || 0} active</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
