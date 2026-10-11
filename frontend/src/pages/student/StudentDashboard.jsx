import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Megaphone,
} from 'lucide-react';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showError } = useToast();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const [profRes, attRes, resRes] = await Promise.all([
          studentApi.getMyProfile(),
          studentApi.getMyAttendance(),
          studentApi.getMyResults(),
        ]);

        if (profRes.success && profRes.data) setProfile(profRes.data);
        if (attRes.success && attRes.data) setAttendance(attRes.data);
        if (resRes.success && resRes.data) setResults(resRes.data);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load student dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [showError]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading student workspace..." size="lg" />
      </div>
    );
  }

  // Calculate overall average attendance
  const totalClasses = attendance.reduce((acc, c) => acc + (c.totalClasses || 0), 0);
  const totalAttended = attendance.reduce((acc, c) => acc + (c.attendedClasses || 0), 0);
  const overallAttendancePct =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

  // Check if any courses are below 75%
  const lowAttendanceCourses = attendance.filter((c) => (c.attendancePercentage || 0) < 75);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Student Profile Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-inner">
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-md border border-indigo-400/30">
                  {profile?.rollNumber}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200/80 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile?.departmentName}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email}
                </span>
                {profile?.academicYear && (
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {profile?.academicYear}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {profile?.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <span className="text-xs uppercase tracking-wider text-indigo-200/60 font-semibold">
              Academic Standing
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                results?.overallStatus === 'PASS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {results?.overallStatus === 'PASS' ? 'Good Standing' : 'Evaluation in Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/student/timetable"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Class Timetable</div>
            <div className="text-[11px] text-slate-400">Weekly schedule</div>
          </div>
        </Link>

        <Link
          to="/student/announcements"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Notice Board</div>
            <div className="text-[11px] text-slate-400">Campus circulars</div>
          </div>
        </Link>

        <Link
          to="/student/attendance"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">My Attendance</div>
            <div className="text-[11px] text-slate-400">Session breakdown</div>
          </div>
        </Link>

        <Link
          to="/student/results"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">Academic Results</div>
            <div className="text-[11px] text-slate-400">Grades & GPA</div>
          </div>
        </Link>
      </div>

      {/* Critical Attendance Warning Alert (< 75%) */}
      {lowAttendanceCourses.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4 text-rose-900 shadow-sm animate-pulse">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-rose-900">
              Low Attendance Warning ({lowAttendanceCourses.length} Subject{lowAttendanceCourses.length > 1 ? 's' : ''})
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              University regulations require a minimum 75% attendance to qualify for final exams.
              The following courses require immediate attention:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowAttendanceCourses.map((c) => (
                <span
                  key={c.courseId}
                  className="px-2.5 py-1 bg-rose-200/60 text-rose-800 text-xs font-bold rounded-lg"
                >
                  {c.courseCode}: {c.attendancePercentage}% ({c.attendedClasses}/{c.totalClasses} classes)
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-bold text-rose-700 underline whitespace-nowrap self-center"
          >
            Review Log
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={attendance.length}
          icon={BookOpen}
          color="indigo"
          subtext="Current term load"
        />
        <StatCard
          title="Overall Attendance"
          value={`${overallAttendancePct}%`}
          icon={CalendarCheck}
          color={overallAttendancePct >= 75 ? 'emerald' : 'rose'}
          subtext={
            overallAttendancePct >= 75
              ? 'Above mandatory 75% quota'
              : 'Below mandatory 75% quota'
          }
        />
        <StatCard
          title="GPA Score"
          value={results?.gpa ? results.gpa.toFixed(2) : '—'}
          icon={Award}
          color="blue"
          subtext={`Cumulative: ${results?.cumulativePercentage ? results.cumulativePercentage.toFixed(1) : '—'}%`}
        />
        <StatCard
          title="Total Credits"
          value={results?.totalCredits ?? 0}
          icon={GraduationCap}
          color="amber"
          subtext="Credit hours completed"
        />
      </div>

      {/* Enrolled Courses & Attendance Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Enrolled Courses & Attendance</h2>
            <p className="text-xs text-slate-500">Live attendance percentage per enrolled subject</p>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Full Attendance Sheet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {attendance.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            You are not enrolled in any courses for the current semester.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendance.map((c) => {
              const pct = c.attendancePercentage ?? 0;
              const isSafe = pct >= 75;

              return (
                <div
                  key={c.courseId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                        {c.courseCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{c.courseTitle}</h4>
                      <p className="text-[11px] text-slate-500">
                        Instructor: {c.facultyName || 'Department Faculty'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        isSafe
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium mt-2">
                    <span>
                      Attended: <strong className="text-slate-700">{c.attendedClasses}</strong> / {c.totalClasses} classes
                    </span>
                    <span>Late: {c.lateClasses || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Academic Results Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Grade Card
          </div>
          <h3 className="text-base font-bold text-slate-900">Academic Marks & Transcripts</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            View course-wise internal, midterm, and final scores along with official letter grades.
          </p>
        </div>
        <Link
          to="/student/results"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          View Full Grade Card <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
