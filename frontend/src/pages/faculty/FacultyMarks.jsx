import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { marksApi } from '../../api/marksApi';
import { attendanceApi } from '../../api/attendanceApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  Save,
  BookOpen,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const FacultyMarks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [examType, setExamType] = useState('MIDTERM');
  const [maxMarks, setMaxMarks] = useState(100);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [marksMap, setMarksMap] = useState({}); // { [enrollmentId]: { marksObtained: '', remarks: '' } }

  const { showSuccess, showError, showWarning } = useToast();

  // Load faculty assigned courses
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

  // Update default maxMarks based on examType
  const handleExamTypeChange = (newType) => {
    setExamType(newType);
    if (newType === 'INTERNAL') setMaxMarks(30);
    else if (newType === 'MIDTERM') setMaxMarks(50);
    else if (newType === 'FINAL') setMaxMarks(100);
  };

  const fetchMarksSheet = useCallback(async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      const res = await marksApi.getCourseMarksSheet(selectedCourseId, examType);
      if (res.success && res.data) {
        setSheetData(res.data);
        if (res.data.maxMarks) {
          setMaxMarks(res.data.maxMarks);
        }

        const initialMap = {};
        (res.data.entries || []).forEach((entry) => {
          initialMap[entry.enrollmentId] = {
            marksObtained: entry.marksObtained !== null ? String(entry.marksObtained) : '',
            remarks: entry.remarks || '',
          };
        });
        setMarksMap(initialMap);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load marks sheet.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, examType, showError]);

  useEffect(() => {
    fetchMarksSheet();
  }, [fetchMarksSheet]);

  const handleMarkChange = (enrollmentId, value) => {
    const num = parseFloat(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > maxMarks)) {
      showWarning(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setMarksMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        marksObtained: value,
      },
    }));
  };

  const handleRemarksChange = (enrollmentId, remarks) => {
    setMarksMap((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        remarks,
      },
    }));
  };

  const calculateGrade = (obtained, max) => {
    if (obtained === '' || isNaN(obtained)) return null;
    const pct = (parseFloat(obtained) / max) * 100;
    if (pct >= 90) return { letter: 'O', label: 'Outstanding', color: 'emerald' };
    if (pct >= 80) return { letter: 'A+', label: 'Excellent', color: 'teal' };
    if (pct >= 70) return { letter: 'A', label: 'Very Good', color: 'blue' };
    if (pct >= 60) return { letter: 'B', label: 'Good', color: 'indigo' };
    if (pct >= 50) return { letter: 'C', label: 'Average', color: 'amber' };
    return { letter: 'F', label: 'Fail', color: 'rose' };
  };

  const handleSaveMarks = async () => {
    if (!selectedCourseId || !sheetData?.entries?.length) return;

    const entriesToSave = [];
    for (const item of sheetData.entries) {
      const state = marksMap[item.enrollmentId];
      if (state && state.marksObtained !== '') {
        const val = parseFloat(state.marksObtained);
        if (val < 0 || val > maxMarks) {
          showError(`Invalid score for ${item.studentName}: must be between 0 and ${maxMarks}`);
          return;
        }
        entriesToSave.push({
          enrollmentId: item.enrollmentId,
          marksObtained: val,
          remarks: state.remarks || '',
        });
      }
    }

    if (entriesToSave.length === 0) {
      showWarning('Please enter marks for at least one student before saving.');
      return;
    }

    try {
      setSaving(true);
      await marksApi.recordBatchMarks(selectedCourseId, {
        examType,
        maxMarks: Number(maxMarks),
        entries: entriesToSave,
      });
      showSuccess(`Marks sheet for ${examType} saved successfully!`);
      fetchMarksSheet();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  // Live average of entered marks
  const enteredMarksList = Object.values(marksMap)
    .map((v) => parseFloat(v.marksObtained))
    .filter((n) => !isNaN(n));
  const liveAvg =
    enteredMarksList.length > 0
      ? (enteredMarksList.reduce((a, b) => a + b, 0) / enteredMarksList.length).toFixed(1)
      : '—';
  const liveHighest =
    enteredMarksList.length > 0 ? Math.max(...enteredMarksList) : '—';
  const liveLowest =
    enteredMarksList.length > 0 ? Math.min(...enteredMarksList) : '—';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Academic Evaluation
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Marks Entry & Grading
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record continuous assessment, midterm evaluations, and semester final examination scores.
          </p>
        </div>

        {sheetData?.entries?.length > 0 && (
          <button
            onClick={handleSaveMarks}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Marks Sheet'}
          </button>
        )}
      </div>

      {/* Control Bar: Course selector, Exam Type & Max Marks */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          {/* Course select */}
          <div>
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
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type select */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => handleExamTypeChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
            >
              <option value="INTERNAL">Internal Assessment</option>
              <option value="MIDTERM">Midterm Examination</option>
              <option value="FINAL">Final Examination</option>
            </select>
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Maximum Score (Scale)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      {sheetData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Enrolled</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{sheetData.entries?.length || 0}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm bg-indigo-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600">Class Average</span>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">{liveAvg} / {maxMarks}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Highest Score</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{liveHighest}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Lowest Score</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{liveLowest}</p>
          </div>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16">
            <LoadingSpinner message="Loading course marks sheet..." />
          </div>
        ) : !sheetData?.entries || sheetData.entries.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No enrolled students found"
              description="There are currently no students registered for this course."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5 w-48">Score (Max: {maxMarks})</th>
                  <th className="px-5 py-3.5 text-center">Grade</th>
                  <th className="px-5 py-3.5">Feedback / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.entries.map((item) => {
                  const state = marksMap[item.enrollmentId] || { marksObtained: '', remarks: '' };
                  const grade = calculateGrade(state.marksObtained, maxMarks);

                  return (
                    <tr key={item.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                          {item.studentRollNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            step="0.5"
                            value={state.marksObtained}
                            onChange={(e) => handleMarkChange(item.enrollmentId, e.target.value)}
                            placeholder="0"
                            className="w-24 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-bold"
                          />
                          <span className="text-xs text-slate-400 font-medium">/ {maxMarks}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        {grade ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              grade.letter === 'F'
                                ? 'bg-rose-100 text-rose-700'
                                : grade.letter === 'O'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {grade.letter} ({grade.label})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          value={state.remarks}
                          onChange={(e) => handleRemarksChange(item.enrollmentId, e.target.value)}
                          placeholder="Feedback comments..."
                          className="w-full max-w-sm px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
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

export default FacultyMarks;
