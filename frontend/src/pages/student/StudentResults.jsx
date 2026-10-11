import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  Printer,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Building2,
  TrendingUp,
} from 'lucide-react';

const StudentResults = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await studentApi.getMyResults();
        if (res.success && res.data) {
          setResults(res.data);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to fetch academic grades.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [showError]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Calculating academic grades..." size="lg" />
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getGradeBadge = (grade) => {
    const colors = {
      O: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      A: 'bg-teal-100 text-teal-800 border-teal-200',
      B: 'bg-blue-100 text-blue-800 border-blue-200',
      C: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      D: 'bg-amber-100 text-amber-800 border-amber-200',
      F: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
          colors[grade] || 'bg-slate-100 text-slate-800 border-slate-200'
        }`}
      >
        Grade {grade || '—'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Academic Transcript
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Performance & Grade Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official cumulative GPA and breakdown across continuous evaluations and final exams.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Transcript
        </button>
      </div>

      {/* Official Transcript Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{results?.studentName}</h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                {results?.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Official Student Record • Degree Program</p>
          </div>

          <div className="flex items-center gap-3">
            {getGradeBadge(results?.overallGrade)}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                results?.overallStatus === 'PASS'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {results?.overallStatus === 'PASS' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> RE-EVALUATION REQUIRED
                </>
              )}
            </span>
          </div>
        </div>

        {/* Results Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Score</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {results?.overallScoreObtained ?? 0}
              <span className="text-xs font-normal text-slate-400"> / {results?.overallMaxScore ?? 0}</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Percentage</span>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">
              {results?.overallPercentage ? `${results.overallPercentage.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Courses Passed</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {results?.passedCourses ?? 0} / {results?.totalCourses ?? 0}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Arrears / Fails</span>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">
              {results?.failedCourses ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Course-Wise Grade Breakdown Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Course-wise Evaluation Sheet</h3>
          <p className="text-xs text-slate-500">Breakdown per registered course for the current term</p>
        </div>

        {(!results?.courseResults || results.courseResults.length === 0) ? (
          <div className="p-12">
            <EmptyState
              title="No course grades recorded yet"
              description="Evaluations have not yet been posted by your course faculty."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Course Code</th>
                  <th className="px-5 py-3.5">Title & Credits</th>
                  <th className="px-5 py-3.5">Exam Component Scores</th>
                  <th className="px-5 py-3.5">Total Score</th>
                  <th className="px-5 py-3.5 text-center">Grade</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.courseResults.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                        {c.courseCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.courseTitle}</div>
                      <div className="text-xs text-slate-400">{c.credits} Credits</div>
                    </td>
                    <td className="px-5 py-4">
                      {c.marks && c.marks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {c.marks.map((m) => (
                            <span
                              key={m.id || m.examType}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                            >
                              <strong className="text-slate-900">{m.examType}:</strong>{' '}
                              {m.marksObtained}/{m.maxMarks}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No exams recorded</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {c.totalScoreObtained} / {c.totalMaxScore}
                      </div>
                      <div className="text-xs text-slate-400">
                        {c.percentage ? `${c.percentage.toFixed(1)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {getGradeBadge(c.grade)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}
                      >
                        {c.status === 'PASS' ? 'Passed' : 'Arrear'}
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
  );
};

export default StudentResults;
