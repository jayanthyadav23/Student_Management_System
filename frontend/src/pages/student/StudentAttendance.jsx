import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';

const StudentAttendance = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const { showError } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await studentApi.getMyAttendance();
        if (res.success && res.data) {
          setAttendanceList(res.data);
          if (res.data.length > 0) {
            setExpandedCourseId(res.data[0].courseId);
          }
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to fetch attendance history.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [showError]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading attendance history..." size="lg" />
      </div>
    );
  }

  const toggleExpand = (courseId) => {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  };

  const totalClassesSum = attendanceList.reduce((acc, c) => acc + (c.totalClasses || 0), 0);
  const presentClassesSum = attendanceList.reduce((acc, c) => acc + (c.presentClasses || 0), 0);
  const lateClassesSum = attendanceList.reduce((acc, c) => acc + (c.lateClasses || 0), 0);
  const absentClassesSum = attendanceList.reduce((acc, c) => acc + (c.absentClasses || 0), 0);
  const overallPct =
    totalClassesSum > 0 ? Math.round((presentClassesSum / totalClassesSum) * 100) : 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4" /> Academic Records
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          My Course Attendance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed session logs, attended lecture dates, and threshold compliance monitor.
        </p>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Classes</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalClassesSum}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Present</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{presentClassesSum}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
          <span className="text-[11px] uppercase tracking-wider font-bold text-rose-600">Absent</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{absentClassesSum}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
          <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Late</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{lateClassesSum}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
          <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600">Average %</span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{overallPct}%</p>
        </div>
      </div>

      {/* Course Breakdown */}
      {attendanceList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12">
          <EmptyState
            title="No Attendance Data Available"
            description="You are currently not enrolled in any active courses."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {attendanceList.map((item) => {
            const isExpanded = expandedCourseId === item.courseId;
            const pct = item.attendancePercentage ?? 0;
            const isSafe = pct >= 75;

            return (
              <div
                key={item.courseId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Course Header Banner */}
                <div
                  onClick={() => toggleExpand(item.courseId)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                          {item.courseCode}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{item.courseTitle}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Instructor: {item.facultyName || 'Staff'} • {item.credits} Credits
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {item.lowAttendanceWarning && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                            <AlertTriangle className="w-3 h-3" /> Critical &lt; 75%
                          </span>
                        )}
                        <span
                          className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${
                            isSafe
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.presentClasses} of {item.totalClasses} classes attended
                      </p>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Progress bar inside card */}
                <div className="px-5 pb-2">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Session Logs */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Session-by-Session Attendance Logs ({item.records?.length || 0} Records)
                    </h4>

                    {(!item.records || item.records.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        No session attendance recorded yet for this course.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.records.map((rec) => (
                              <tr key={rec.id || rec.date} className="hover:bg-slate-50/60">
                                <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                                  {rec.date}
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  {rec.status === 'PRESENT' && (
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                      <CheckCircle2 className="w-3 h-3" /> Present
                                    </span>
                                  )}
                                  {rec.status === 'ABSENT' && (
                                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                                      <XCircle className="w-3 h-3" /> Absent
                                    </span>
                                  )}
                                  {rec.status === 'LATE' && (
                                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                                      <Clock className="w-3 h-3" /> Late
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500">
                                  {rec.remarks || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
