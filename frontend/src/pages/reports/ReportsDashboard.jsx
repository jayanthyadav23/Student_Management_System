import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportApi } from '../../api/reportApi';
import { courseApi } from '../../api/courseApi';
import { attendanceApi } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  BarChart3,
  CalendarCheck,
  Award,
  Download,
  Filter,
  Users2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';

const ReportsDashboard = () => {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'results' | 'performance'

  // Tab 1: Attendance State
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [below75Only, setBelow75Only] = useState(false);

  // Tab 2: Results State
  const [resultsReport, setResultsReport] = useState(null);

  // Tab 3: Performance State
  const [performanceReport, setPerformanceReport] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { showError, showSuccess } = useToast();

  // Load available courses depending on user role
  useEffect(() => {
    const loadCourses = async () => {
      try {
        let res;
        if (role === 'ADMIN') {
          res = await courseApi.getAllDropdown();
        } else {
          res = await attendanceApi.getAssignedCourses();
        }
        if (res.success && res.data) {
          setCourses(res.data);
          if (!selectedCourseId && res.data.length > 0) {
            setSelectedCourseId(String(res.data[0].id));
          }
        }
      } catch (err) {
        showError('Failed to load courses for report generator.');
      }
    };
    loadCourses();
  }, [role]);

  // Fetch report data when course, tab, or below75Only changes
  const fetchReportData = useCallback(async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      if (activeTab === 'attendance') {
        const res = await reportApi.getAttendanceReport(selectedCourseId, below75Only);
        if (res.success && res.data) setAttendanceReport(res.data);
      } else if (activeTab === 'results') {
        const res = await reportApi.getResultsReport(selectedCourseId);
        if (res.success && res.data) setResultsReport(res.data);
      } else if (activeTab === 'performance') {
        const res = await reportApi.getPerformanceReport(selectedCourseId);
        if (res.success && res.data) setPerformanceReport(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch analytics report.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, activeTab, below75Only, showError]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // CSV Export Handlers
  const handleExport = async () => {
    if (!selectedCourseId) return;
    try {
      setExporting(true);
      if (activeTab === 'attendance') {
        await reportApi.exportAttendanceCsv(selectedCourseId, below75Only);
        showSuccess('Attendance CSV report downloaded successfully.');
      } else if (activeTab === 'results') {
        await reportApi.exportResultsCsv(selectedCourseId);
        showSuccess('Results & Grades CSV report downloaded successfully.');
      } else if (activeTab === 'performance') {
        await reportApi.exportPerformanceCsv(selectedCourseId);
        showSuccess('Performance Distribution CSV report downloaded successfully.');
      }
    } catch (err) {
      showError('Failed to generate CSV export file.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> Academic Analytics
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Institutional Reports & Exports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit course attendance compliance, grade distributions, and download official CSV records.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || loading || !selectedCourseId}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Generating CSV...' : 'Download CSV Export'}
        </button>
      </div>

      {/* Control Bar: Course Selector & Report Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Course select */}
        <div className="flex-1 max-w-md">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Filter by Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSearchParams({ courseId: e.target.value });
            }}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1 self-start md:self-end">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Attendance Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Results & Grades
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'performance'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Performance Curve
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Generating analytical report..." size="lg" />
        </div>
      ) : (
        <>
          {/* TAB 1: ATTENDANCE REPORT */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Filter sub-bar */}
              <div className="flex items-center justify-between bg-slate-50/80 p-3.5 px-5 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Threshold Compliance Filter</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={below75Only}
                    onChange={(e) => setBelow75Only(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="font-bold text-rose-700">
                    Show only students below 75% threshold
                  </span>
                </label>
              </div>

              {/* KPI Strip */}
              {attendanceReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Classes</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{attendanceReport.totalClasses ?? 0}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Enrolled Students</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{attendanceReport.totalEnrolled ?? 0}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600">Class Attendance</span>
                    <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                      {attendanceReport.averageAttendancePercentage ? `${attendanceReport.averageAttendancePercentage.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-rose-600">Defaulters (&lt; 75%)</span>
                    <p className="text-2xl font-extrabold text-rose-700 mt-1">{attendanceReport.studentsBelowThresholdCount ?? 0}</p>
                  </div>
                </div>
              )}

              {/* Student Attendance Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {(!attendanceReport?.items || attendanceReport.items.length === 0) ? (
                  <div className="p-12">
                    <EmptyState
                      title="No students match the criteria"
                      description={below75Only ? 'Great news! No students are below 75% attendance.' : 'No students found.'}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5">Roll Number</th>
                          <th className="px-5 py-3.5">Student Name</th>
                          <th className="px-5 py-3.5">Attended / Total</th>
                          <th className="px-5 py-3.5">Attendance %</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceReport.items.map((row) => {
                          const isSafe = (row.attendancePercentage ?? 0) >= 75;
                          return (
                            <tr key={row.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded">
                                  {row.rollNumber}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                                {row.studentName}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                {row.attendedClasses} / {row.totalClasses}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                    isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {row.attendancePercentage ? `${row.attendancePercentage.toFixed(1)}%` : '0%'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isSafe ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                  }`}
                                >
                                  {isSafe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                  {isSafe ? 'Eligible' : 'Detained'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESULTS REPORT */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* KPI Strip */}
              {resultsReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Class Average</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      {resultsReport.classAveragePercentage ? `${resultsReport.classAveragePercentage.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Topper Score</span>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                      {resultsReport.highestPercentage ? `${resultsReport.highestPercentage.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600">Pass Rate</span>
                    <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                      {resultsReport.passRate ? `${resultsReport.passRate.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Pass / Fail</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">
                      <span className="text-emerald-600 font-bold">{resultsReport.passCount ?? 0}</span> /{' '}
                      <span className="text-rose-600 font-bold">{resultsReport.failCount ?? 0}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Student Results Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {(!resultsReport?.items || resultsReport.items.length === 0) ? (
                  <div className="p-12">
                    <EmptyState
                      title="No exam results available"
                      description="Faculty members have not posted marks for this course yet."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5">Roll Number</th>
                          <th className="px-5 py-3.5">Student Name</th>
                          <th className="px-5 py-3.5">Total Score</th>
                          <th className="px-5 py-3.5">Percentage</th>
                          <th className="px-5 py-3.5 text-center">Grade</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultsReport.items.map((row) => (
                          <tr key={row.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded">
                                {row.rollNumber}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                              {row.studentName}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {row.totalScoreObtained} / {row.totalMaxScore}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                              {row.percentage ? `${row.percentage.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-xs">
                                {row.grade || '—'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                  row.status === 'PASS'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {row.status === 'PASS' ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE DISTRIBUTION */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Distribution Bar Chart Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Score Distribution Histogram</h3>
                    <p className="text-xs text-slate-500">Student count distribution across standard performance tiers</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Class Mean</span>
                    <p className="text-lg font-extrabold text-indigo-600">
                      {performanceReport?.averageScore ? `${performanceReport.averageScore.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </div>

                {(!performanceReport?.distribution || performanceReport.distribution.length === 0) ? (
                  <p className="text-sm text-slate-400 py-10 text-center">No performance histogram available yet.</p>
                ) : (
                  <div className="space-y-5">
                    {performanceReport.distribution.map((bucket) => {
                      const pct = bucket.percentage ?? 0;
                      return (
                        <div key={bucket.rangeLabel} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-700">{bucket.rangeLabel}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 font-bold">{bucket.studentCount} students</span>
                              <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsDashboard;
