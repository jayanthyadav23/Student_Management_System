import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi';
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
} from 'lucide-react';

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useToast();

  const fetchAssignedCourses = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getAssignedCourses();
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load assigned courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading faculty dashboard..." size="lg" />
      </div>
    );
  }

  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);
  const uniqueDepts = new Set(courses.map((c) => c.departmentName)).size;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-teal-950/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Instructor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Professor'}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Manage your daily course attendance, input academic exam marks, and monitor student performance metrics.
          </p>
        </div>
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
          title="Students Taught"
          value={totalStudents}
          icon={Users2}
          color="emerald"
          subtext="Total course registrations"
        />
        <StatCard
          title="Departments"
          value={uniqueDepts}
          icon={Building2}
          color="amber"
          subtext="Cross-discipline programs"
        />
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Assigned Courses</h2>
            <p className="text-xs text-slate-500">
              Select any course to record attendance or evaluate student marks.
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <EmptyState
              title="No courses assigned yet"
              description="An administrator has not assigned you any courses for this semester."
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
                      Sem {course.semester} • {course.credits} Cr
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {course.description || 'No course syllabus description provided.'}
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

                {/* Course Actions */}
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
    </div>
  );
};

export default FacultyDashboard;
