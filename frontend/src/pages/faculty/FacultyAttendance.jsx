import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users2,
  Calendar,
  Sparkles,
} from 'lucide-react';

const FacultyAttendance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);

  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [enrollmentId]: { status: 'PRESENT'|'ABSENT'|'LATE', remarks: '' } }

  const { showSuccess, showError } = useToast();

  // Load faculty's courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await attendanceApi.getAssignedCourses();
        if (res.success && res.data) {
          setCourses(res.data);
          if (!selectedCourseId && res.data.length > 0) {
            setSelectedCourseId(String(res.data[0].id));
          }
        }
      } catch (err) {
        showError('Failed to load courses.');
      }
    };
    loadCourses();
  }, []);

  // Fetch sheet when course or date changes
  const fetchAttendanceSheet = useCallback(async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      const res = await attendanceApi.getAttendanceSheet(selectedCourseId, selectedDate);
      if (res.success && res.data) {
        setSheetData(res.data);

        // Pre-populate attendance map
        const initialMap = {};
        (res.data.records || []).forEach((rec) => {
          initialMap[rec.enrollmentId] = {
            status: rec.status || 'PRESENT',
            remarks: rec.remarks || '',
          };
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load attendance sheet.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedDate, showError]);

  useEffect(() => {
    fetchAttendanceSheet();
  }, [fetchAttendanceSheet]);

  const handleStatusChange = (enrollmentId, newStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status: newStatus,
      },
    }));
  };

  const handleRemarksChange = (enrollmentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status) => {
    if (!sheetData?.records) return;
    const updated = { ...attendanceMap };
    sheetData.records.forEach((rec) => {
      updated[rec.enrollmentId] = {
        ...updated[rec.enrollmentId],
        status,
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId || !sheetData?.records?.length) return;

    const entries = sheetData.records.map((rec) => {
      const state = attendanceMap[rec.enrollmentId] || {};
      return {
        enrollmentId: rec.enrollmentId,
        status: state.status || 'PRESENT',
        remarks: state.remarks || '',
      };
    });

    try {
      setSaving(true);
      await attendanceApi.markBulkAttendance(selectedCourseId, {
        date: selectedDate,
        entries,
      });
      showSuccess(`Attendance recorded for ${selectedDate}!`);
      fetchAttendanceSheet();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Live dynamic counts based on attendanceMap
  const studentCount = sheetData?.records?.length || 0;
  const currentPresent = Object.values(attendanceMap).filter((v) => v.status === 'PRESENT').length;
  const currentAbsent = Object.values(attendanceMap).filter((v) => v.status === 'ABSENT').length;
  const currentLate = Object.values(attendanceMap).filter((v) => v.status === 'LATE').length;
  const currentPercent = studentCount > 0 ? Math.round((currentPresent / studentCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" /> Academic Records
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daily Attendance Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mark daily student presence, record excused absences, and monitor attendance ratios.
          </p>
        </div>

        {sheetData?.records?.length > 0 && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Control Bar: Course selector & Date picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          {/* Course select */}
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Course
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
                  {c.code} - {c.title} ({c.enrollmentCount ?? 0} Students)
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="w-full sm:w-48">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Session Date
            </label>
            <div className="relative">
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Quick Batch Selectors */}
        {sheetData?.records?.length > 0 && (
          <div className="flex items-end gap-2 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/60 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/60 transition-colors"
            >
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      {sheetData && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Enrolled</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{studentCount}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Present</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{currentPresent}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-rose-600">Absent</span>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{currentAbsent}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Late</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{currentLate}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600">Attendance %</span>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">{currentPercent}%</p>
          </div>
        </div>
      )}

      {/* Roster Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16">
            <LoadingSpinner message="Loading course enrollment sheet..." />
          </div>
        ) : !sheetData?.records || sheetData.records.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No enrolled students found"
              description="There are currently no students enrolled in this course to take attendance for."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5 text-center">Attendance Status</th>
                  <th className="px-5 py-3.5">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.records.map((rec) => {
                  const currentStatus = attendanceMap[rec.enrollmentId]?.status || 'PRESENT';
                  const currentRemarks = attendanceMap[rec.enrollmentId]?.remarks || '';

                  return (
                    <tr key={rec.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          {rec.studentRollNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{rec.studentName}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(rec.enrollmentId, 'PRESENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(rec.enrollmentId, 'ABSENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(rec.enrollmentId, 'LATE')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(rec.enrollmentId, e.target.value)}
                          placeholder="Optional notes..."
                          className="w-full max-w-xs px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />
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
  );
};

export default FacultyAttendance;
