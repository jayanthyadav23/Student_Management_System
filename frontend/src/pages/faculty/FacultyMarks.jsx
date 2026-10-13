import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { marksApi } from '../../api/marksApi';
import { attendanceApi } from '../../api/attendanceApi';
import { studentApi } from '../../api/studentApi';
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
  Search,
  UserPlus,
  X,
  GraduationCap
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
  const [tableSearch, setTableSearch] = useState('');

  // Quick Enrollment Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const { showSuccess, showError, showWarning } = useToast();

  // Load faculty assigned courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await attendanceApi.getAssignedCourses();
        if (res.success && res.data) {
          setCourses(res.data);
          if (res.data.length > 0) {
            const exists = res.data.some((c) => String(c.id) === String(selectedCourseId));
            if (!selectedCourseId || !exists) {
              setSelectedCourseId(String(res.data[0].id));
            }
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
    else if (newType === 'ASSIGNMENT') setMaxMarks(20);
    else if (newType === 'LAB') setMaxMarks(50);
  };

  const fetchMarksSheet = useCallback(async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      const res = await marksApi.getCourseMarksSheet(selectedCourseId, examType);
      if (res.success && res.data) {
        setSheetData(res.data);
        if (res.data.maxScore || res.data.maxMarks) {
          setMaxMarks(res.data.maxScore || res.data.maxMarks);
        }

        const entriesList = res.data.entries || res.data.marks || [];
        const initialMap = {};
        entriesList.forEach((entry) => {
          // Check if previously graded
          const isGraded = entry.id !== null && entry.id !== undefined && entry.score !== null && entry.score !== undefined;
          const val = isGraded
            ? String(entry.score)
            : (entry.marksObtained !== undefined && entry.marksObtained !== null && entry.marksObtained !== '' ? String(entry.marksObtained) : '');
          initialMap[entry.enrollmentId] = {
            marksObtained: val,
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
    if (pct >= 80) return { letter: 'A', label: 'Excellent', color: 'teal' };
    if (pct >= 70) return { letter: 'B', label: 'Very Good', color: 'blue' };
    if (pct >= 60) return { letter: 'C', label: 'Good', color: 'indigo' };
    if (pct >= 50) return { letter: 'D', label: 'Average', color: 'amber' };
    return { letter: 'F', label: 'Fail', color: 'rose' };
  };

  const currentEntries = useMemo(() => {
    return sheetData?.entries || sheetData?.marks || [];
  }, [sheetData]);

  const filteredEntries = useMemo(() => {
    if (!tableSearch.trim()) return currentEntries;
    const q = tableSearch.toLowerCase();
    return currentEntries.filter(
      (item) =>
        item.studentName?.toLowerCase().includes(q) ||
        item.studentRollNumber?.toLowerCase().includes(q)
    );
  }, [currentEntries, tableSearch]);

  const handleSaveMarks = async () => {
    if (!selectedCourseId) {
      showError('Please select a course first.');
      return;
    }
    if (!currentEntries.length) {
      showWarning('No students are enrolled in this course.');
      return;
    }

    const entriesToSave = [];
    for (const item of currentEntries) {
      const state = marksMap[item.enrollmentId];
      if (state && state.marksObtained !== '' && state.marksObtained !== undefined && state.marksObtained !== null) {
        const val = parseFloat(state.marksObtained);
        if (isNaN(val) || val < 0 || val > maxMarks) {
          showError(`Invalid score for ${item.studentName}: must be between 0 and ${maxMarks}`);
          return;
        }
        entriesToSave.push({
          enrollmentId: item.enrollmentId,
          score: val,
          marksObtained: val,
          maxScore: Number(maxMarks),
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
        defaultMaxScore: Number(maxMarks),
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

  // Quick enroll modal open
  const handleOpenEnrollModal = async () => {
    setShowEnrollModal(true);
    try {
      setLoadingStudents(true);
      const res = await studentApi.getAllStudentsList();
      if (res.success && res.data) {
        setAllStudents(res.data);
      }
    } catch (err) {
      showError('Failed to fetch department student list.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToEnroll) {
      showWarning('Please select a student to enroll.');
      return;
    }

    try {
      setEnrolling(true);
      await studentApi.enrollStudent({
        studentId: Number(selectedStudentToEnroll),
        courseId: Number(selectedCourseId),
      });
      showSuccess('Student enrolled successfully into this course!');
      setShowEnrollModal(false);
      setSelectedStudentToEnroll('');
      fetchMarksSheet();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setEnrolling(false);
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

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-100">
            <Award className="w-3.5 h-3.5" />
            Evaluation & Grades
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Marks Entry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate and record examination, test, and assignment marks for your assigned courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCourseId && (
            <button
              type="button"
              onClick={handleOpenEnrollModal}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Enroll Student
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveMarks}
            disabled={saving || loading || !currentEntries.length}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Marks...' : 'Save Marks Sheet'}
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Course Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Assigned Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSearchParams({ courseId: e.target.value });
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-semibold"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title} (Sem {course.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              Assessment / Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => handleExamTypeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-semibold"
            >
              <option value="INTERNAL">Internal Assessment (Max: 30)</option>
              <option value="MIDTERM">Midterm Exam (Max: 50)</option>
              <option value="FINAL">Final Exam (Max: 100)</option>
              <option value="ASSIGNMENT">Assignment (Max: 20)</option>
              <option value="LAB">Lab / Practical Exam (Max: 50)</option>
            </select>
          </div>

          {/* Max Marks config */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              Maximum Score Limit
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-semibold"
            />
          </div>
        </div>

        {/* Selected Course Quick Stats */}
        {selectedCourse && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800">{selectedCourse.title}</span>
              <span>•</span>
              <span>Dept: {selectedCourse.departmentName}</span>
              <span>•</span>
              <span>Credits: {selectedCourse.credits}</span>
            </div>
            <div className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              Grading scale: O (&ge;90%), A (&ge;80%), B (&ge;70%), C (&ge;60%), D (&ge;50%), F (&lt;50%)
            </div>
          </div>
        )}
      </div>

      {/* Real-time Summary Cards */}
      {currentEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Enrolled</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{currentEntries.length}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-500">Class Average</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{liveAvg} / {maxMarks}</p>
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
        ) : courses.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Courses Assigned"
              description="You do not have any courses assigned to your faculty profile. Ask an administrator to assign a course."
            />
          </div>
        ) : currentEntries.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="No enrolled students found"
              description="There are currently no students registered for this course."
            />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleOpenEnrollModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Enroll Student into Course
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Table Search filter */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter by student name or roll number..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Showing {filteredEntries.length} of {currentEntries.length} students
              </div>
            </div>

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
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No students match "{tableSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => {
                      const state = marksMap[item.enrollmentId] || { marksObtained: '', remarks: '' };
                      const grade = calculateGrade(state.marksObtained, maxMarks);

                      return (
                        <tr key={item.enrollmentId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                              {item.studentRollNumber || item.rollNumber || '—'}
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
                              placeholder="e.g. Excellent work, Good effort..."
                              className="w-full px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Quick Course Enrollment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Register an eligible student into this course ({selectedCourse?.code} - {selectedCourse?.title}).
            </p>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Student
                </label>
                {loadingStudents ? (
                  <div className="py-4 text-center">
                    <LoadingSpinner message="Fetching eligible students..." size="sm" />
                  </div>
                ) : (
                  <select
                    value={selectedStudentToEnroll}
                    onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-semibold"
                    required
                  >
                    <option value="">-- Choose student from directory --</option>
                    {allStudents
                      .filter((st) => !currentEntries.some((r) => r.studentId === st.id))
                      .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.rollNumber} - {st.name} ({st.departmentName}, Sem {st.semester})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling || !selectedStudentToEnroll}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMarks;
