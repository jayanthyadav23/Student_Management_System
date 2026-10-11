import React, { useState, useEffect, useCallback } from 'react';
import { courseApi } from '../../api/courseApi';
import { departmentApi } from '../../api/departmentApi';
import { facultyApi } from '../../api/facultyApi';
import { studentApi } from '../../api/studentApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Building2,
  Award,
  Users,
  Archive,
  CheckCircle,
  XCircle,
  UserMinus,
  UserPlus,
} from 'lucide-react';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('code');
  const [sortDir, setSortDir] = useState('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    credits: 3,
    semester: 1,
    academicYear: '2024-2025',
    departmentId: '',
    facultyId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Quick Faculty Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState(null);
  const [assignedFacultyId, setAssignedFacultyId] = useState('');

  // Course Students Management Modal
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentToEnrollId, setStudentToEnrollId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchDropdowns = async () => {
    try {
      const [deptRes, facRes, stuRes] = await Promise.all([
        departmentApi.getAllDropdown(),
        facultyApi.getAllDropdown(),
        studentApi.getAllList(),
      ]);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (facRes.success && facRes.data) setFacultyOptions(facRes.data);
      if (stuRes.success && stuRes.data) setAllStudents(stuRes.data);
    } catch {
      // Ignore background dropdown errors
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await courseApi.getAll({
        page,
        size,
        search: search.trim() || undefined,
        departmentId: selectedDeptId || undefined,
        sortBy,
        sortDir,
      });

      if (res.success && res.data) {
        setCourses(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch course catalog.');
    } finally {
      setLoading(false);
    }
  }, [page, size, search, selectedDeptId, sortBy, sortDir, showError]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      credits: 3,
      semester: 1,
      academicYear: '2024-2025',
      departmentId: departments.length > 0 ? departments[0].id : '',
      facultyId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      description: course.description || '',
      credits: course.credits || 3,
      semester: course.semester || 1,
      academicYear: course.academicYear || '2024-2025',
      departmentId: course.departmentId || '',
      facultyId: course.facultyId || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (course) => {
    try {
      await courseApi.toggleStatus(course.id);
      showSuccess(`Status updated for ${course.code}`);
      fetchCourses();
    } catch (err) {
      showError('Failed to toggle course status.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim() || !formData.departmentId) {
      showError('Course code, title, and department are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        academicYear: formData.academicYear.trim(),
        departmentId: Number(formData.departmentId),
        facultyId: formData.facultyId ? Number(formData.facultyId) : null,
      };

      if (editingCourse) {
        await courseApi.update(editingCourse.id, payload);
        showSuccess('Course details updated successfully.');
      } else {
        await courseApi.create(payload);
        showSuccess('New course created successfully.');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Manage Enrolled Students
  const handleOpenStudentsModal = async (course) => {
    setSelectedCourseForStudents(course);
    setStudentToEnrollId('');
    setStudentsModalOpen(true);
    try {
      setLoadingStudents(true);
      const res = await courseApi.getStudents(course.id);
      if (res.success && res.data) {
        setEnrolledStudents(res.data);
      }
    } catch (err) {
      showError('Failed to load enrolled students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!studentToEnrollId || !selectedCourseForStudents) return;
    try {
      setSubmitting(true);
      await courseApi.enrollStudent(selectedCourseForStudents.id, Number(studentToEnrollId));
      showSuccess('Student enrolled in course.');
      setStudentToEnrollId('');
      const res = await courseApi.getStudents(selectedCourseForStudents.id);
      if (res.success && res.data) setEnrolledStudents(res.data);
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedCourseForStudents) return;
    try {
      await courseApi.removeStudent(selectedCourseForStudents.id, studentId);
      showSuccess('Student unenrolled from course.');
      const res = await courseApi.getStudents(selectedCourseForStudents.id);
      if (res.success && res.data) setEnrolledStudents(res.data);
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove student from course.');
    }
  };

  // Quick Faculty Assign
  const handleOpenAssignFaculty = (course) => {
    setCourseToAssign(course);
    setAssignedFacultyId(course.facultyId || '');
    setAssignModalOpen(true);
  };

  const handleAssignFacultySubmit = async (e) => {
    e.preventDefault();
    if (!courseToAssign) return;

    try {
      setSubmitting(true);
      await courseApi.assignFaculty(
        courseToAssign.id,
        assignedFacultyId ? Number(assignedFacultyId) : null
      );
      showSuccess('Course faculty assignment updated.');
      setAssignModalOpen(false);
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to assign faculty.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await courseApi.delete(deleteTarget.id);
      showSuccess(`Course ${deleteTarget.code} deleted successfully.`);
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Course Code',
      sortable: true,
      sortField: 'code',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          {row.code}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Course Title',
      sortable: true,
      sortField: 'title',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.title}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            <span>Semester {row.semester}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
              <Award className="w-3 h-3" /> {row.credits} Credits
            </span>
            {row.academicYear && (
              <>
                <span>•</span>
                <span className="text-slate-400 font-mono text-[10px]">{row.academicYear}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'facultyName',
      header: 'Assigned Faculty',
      render: (row) => (
        <div className="flex items-center justify-between gap-2">
          {row.facultyName ? (
            <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              {row.facultyName}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          )}
          <button
            onClick={() => handleOpenAssignFaculty(row)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Assign
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const isActive = row.status !== 'ARCHIVED';
        return (
          <button
            onClick={() => handleToggleStatus(row)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
            }`}
            title="Click to toggle status"
          >
            {isActive ? (
              <>
                <CheckCircle className="w-3 h-3" /> Active
              </>
            ) : (
              <>
                <Archive className="w-3 h-3" /> Archived
              </>
            )}
          </button>
        );
      },
    },
    {
      key: 'enrollmentCount',
      header: 'Enrolled',
      render: (row) => (
        <button
          onClick={() => handleOpenStudentsModal(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors"
          title="Manage enrolled students"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{row.enrollmentCount ?? 0} Students</span>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenStudentsModal(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Manage Enrolled Students"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit Course"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Course"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Academic Catalog
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure courses, syllabi, credit weighting, faculty assignments, and student rosters.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <select
          value={selectedDeptId}
          onChange={(e) => {
            setSelectedDeptId(e.target.value);
            setPage(0);
          }}
          className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
        >
          <option value="">All Academic Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={courses}
        loading={loading}
        searchPlaceholder="Search courses by code or title..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        pageNumber={page}
        pageSize={size}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(newPage) => setPage(newPage)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(col, dir) => {
          setSortBy(col);
          setSortDir(dir);
        }}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course Details' : 'Create New Course'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="CS101"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Credits (1 - 6) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Introduction to Data Structures"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Semester (1 - 8) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Instructor
              </label>
              <select
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Unassigned</option>
                {facultyOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Course Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Syllabus topics, objectives, prerequisites..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Enrolled Students Modal */}
      <Modal
        isOpen={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        title={`Roster: ${selectedCourseForStudents?.code || ''} - ${selectedCourseForStudents?.title || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleEnrollStudent} className="flex gap-2">
            <select
              value={studentToEnrollId}
              onChange={(e) => setStudentToEnrollId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select student to enroll into this course...</option>
              {allStudents
                .filter((s) => !enrolledStudents.some((es) => es.id === s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber} - {s.firstName} {s.lastName} ({s.departmentName})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!studentToEnrollId || submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Enroll
            </button>
          </form>

          {loadingStudents ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading student roster...</div>
          ) : enrolledStudents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No students enrolled in this course yet.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {enrolledStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                      {s.rollNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(s.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remove from course"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStudentsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Faculty Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Instructor to ${courseToAssign?.code || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignFacultySubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select a faculty member who will be authorized to take attendance and submit marks for{' '}
            <strong className="text-slate-800">{courseToAssign?.title}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Instructor
            </label>
            <select
              value={assignedFacultyId}
              onChange={(e) => setAssignedFacultyId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Unassigned (None)</option>
              {facultyOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.departmentName || f.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete course ${deleteTarget?.code} - "${deleteTarget?.title}"? All existing student enrollments in this course will also be removed.`}
        confirmText="Delete Course"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ManageCourses;
