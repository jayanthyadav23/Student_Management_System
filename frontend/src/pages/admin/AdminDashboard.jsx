import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Users2,
  BookOpen,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  RefreshCw,
  Layers,
  Megaphone,
  History,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading system dashboard..." size="lg" />
      </div>
    );
  }

  // Calculate highest count for scaling department bars
  const maxDeptCount = stats?.studentsPerDepartment?.reduce(
    (max, d) => Math.max(max, d.studentCount || 0),
    1
  ) || 1;

  const maxCourseEnrollment = stats?.topEnrolledCourses?.reduce(
    (max, c) => Math.max(max, c.enrollmentCount || 0),
    1
  ) || 1;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live System Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Workspace
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Monitor institutional enrollment, faculty allocations, subjects, announcements, and cross-department analytics in real-time.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={GraduationCap}
          color="indigo"
          subtext="Active admissions"
        />
        <StatCard
          title="Faculty"
          value={stats?.totalFaculty ?? 0}
          icon={Users2}
          color="emerald"
          subtext="Teaching staff"
        />
        <StatCard
          title="Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          color="blue"
          subtext="Programs catalog"
        />
        <StatCard
          title="Subjects"
          value={stats?.totalSubjects ?? 0}
          icon={Layers}
          color="purple"
          subtext="Theory & Lab units"
        />
        <StatCard
          title="Departments"
          value={stats?.totalDepartments ?? 0}
          icon={Building2}
          color="amber"
          subtext="Academic wings"
        />
        <StatCard
          title="Announcements"
          value={stats?.activeAnnouncementsCount ?? 0}
          icon={Megaphone}
          color="rose"
          subtext="Active circulars"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Students per Department</h3>
                <p className="text-xs text-slate-500">Student enrollment spread across academic wings</p>
              </div>
            </div>
            <Link
              to="/admin/departments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!stats?.studentsPerDepartment || stats.studentsPerDepartment.length === 0) ? (
            <p className="text-sm text-slate-400 py-8 text-center">No department enrollment data available yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.studentsPerDepartment.map((dept) => {
                const percentage = Math.round((dept.studentCount / maxDeptCount) * 100);
                return (
                  <div key={dept.departmentId || dept.departmentName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{dept.departmentName}</span>
                      <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                        {dept.studentCount} students
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Enrolled Courses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Top Enrolled Courses</h3>
                <p className="text-xs text-slate-500">Most demanded subjects by student count</p>
              </div>
            </div>
            <Link
              to="/admin/courses"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!stats?.topEnrolledCourses || stats.topEnrolledCourses.length === 0) ? (
            <p className="text-sm text-slate-400 py-8 text-center">No course enrollment data recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.topEnrolledCourses.map((c, index) => {
                const percentage = Math.round((c.enrollmentCount / maxCourseEnrollment) * 100);
                return (
                  <div key={c.courseId || index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-slate-800 font-bold">{c.courseCode}</span>
                        <span className="text-slate-500 font-normal truncate max-w-[180px] sm:max-w-[240px]">
                          {c.courseTitle}
                        </span>
                      </div>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {c.enrollmentCount} enrolled
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities / System Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent System Activities</h3>
              <p className="text-xs text-slate-500">Live administrative audit log and user security actions</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit Logging Active
          </span>
        </div>

        {(!stats?.recentActivities || stats.recentActivities.length === 0) ? (
          <p className="text-sm text-slate-400 py-6 text-center">No recent system activities recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Performed By</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stats.recentActivities.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{log.performedBy || 'System'}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-semibold">{log.targetResource || 'General'}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Quick Administrative Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to="/admin/departments"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Departments</h4>
            <p className="text-xs text-slate-500 mt-1">Configure academic divisions</p>
          </Link>

          <Link
            to="/admin/faculty"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Faculty</h4>
            <p className="text-xs text-slate-500 mt-1">Workloads & assignments</p>
          </Link>

          <Link
            to="/admin/courses"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Courses</h4>
            <p className="text-xs text-slate-500 mt-1">Manage syllabus & credits</p>
          </Link>

          <Link
            to="/admin/subjects"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Subjects</h4>
            <p className="text-xs text-slate-500 mt-1">Theory & Lab courses</p>
          </Link>

          <Link
            to="/admin/timetable"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Timetable</h4>
            <p className="text-xs text-slate-500 mt-1">Class schedule & rooms</p>
          </Link>

          <Link
            to="/admin/announcements"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Megaphone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Announce</h4>
            <p className="text-xs text-slate-500 mt-1">Broadcast circulars</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
