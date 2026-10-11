import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../../api/studentApi';
import { departmentApi } from '../../api/departmentApi';
import { courseApi } from '../../api/courseApi';
import { adminApi } from '../../api/adminApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  KeyRound,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rollNumber');
  const [sortDir, setSortDir] = useState('asc');

  // Student Create/Edit Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    rollNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    departmentId: '',
  });

  // Course Enrollment Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [currentStudentForEnroll, setCurrentStudentForEnroll] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Account Control Modal (Password Reset & Status Toggle)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [currentAccountStudent, setCurrentAccountStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchDropdowns = async () => {
    try {
      const [deptRes, courseRes] = await Promise.all([
        departmentApi.getAllDropdown(),
        courseApi.getAllDropdown(),
      ]);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (courseRes.success && courseRes.data) setAllCourses(courseRes.data);
    } catch {
      // Ignore background dropdown errors
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAll({
        page,
        size,
        search: search.trim() || undefined,
        departmentId: selectedDeptId || undefined,
        sortBy,
        sortDir,
      });

      if (res.success && res.data) {
        setStudents(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  }, [page, size, search, selectedDeptId, sortBy, sortDir, showError]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Open Create/Edit
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentFormData({
      rollNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      departmentId: departments.length > 0 ? departments[0].id : '',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setStudentFormData({
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: '',
      phone: student.phone || '',
      departmentId: student.departmentId || '',
    });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingStudent) {
        await studentApi.update(editingStudent.id, {
          firstName: studentFormData.firstName,
          lastName: studentFormData.lastName,
          phone: studentFormData.phone,
          departmentId: Number(studentFormData.departmentId),
        });
        showSuccess('Student record updated.');
      } else {
        await studentApi.create({
          rollNumber: studentFormData.rollNumber.toUpperCase(),
          firstName: studentFormData.firstName,
          lastName: studentFormData.lastName,
          email: studentFormData.email,
          password: studentFormData.password,
          phone: studentFormData.phone,
          departmentId: Number(studentFormData.departmentId),
        });
        showSuccess('Student admitted and account created.');
      }
      setIsStudentModalOpen(false);
      fetchStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Enrollment Manager
  const handleOpenEnrollments = async (student) => {
    setCurrentStudentForEnroll(student);
    setSelectedCourseToEnroll('');
    setIsEnrollModalOpen(true);
    try {
      setEnrollLoading(true);
      const res = await studentApi.getEnrollments(student.id);
      if (res.success && res.data) {
        setStudentEnrollments(res.data);
      }
    } catch (err) {
      showError('Failed to fetch enrolled courses.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleEnrollCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourseToEnroll) return;
    try {
      setSubmitting(true);
      await studentApi.enroll({
        studentId: currentStudentForEnroll.id,
        courseId: Number(selectedCourseToEnroll),
      });
      showSuccess('Enrolled in course successfully.');
      setSelectedCourseToEnroll('');
      // refresh enrollments
      const res = await studentApi.getEnrollments(currentStudentForEnroll.id);
      if (res.success && res.data) setStudentEnrollments(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enroll course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenrollCourse = async (courseId) => {
    try {
      await studentApi.unenroll(currentStudentForEnroll.id, courseId);
      showSuccess('Course enrollment removed.');
      const res = await studentApi.getEnrollments(currentStudentForEnroll.id);
      if (res.success && res.data) setStudentEnrollments(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to unenroll student.');
    }
  };

  // Open Account Controls
  const handleOpenAccount = (student) => {
    setCurrentAccountStudent(student);
    setNewPassword('');
    setIsAccountModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!currentAccountStudent) return;
    try {
      setSubmitting(true);
      const newStatus = !currentAccountStudent.enabled;
      await adminApi.toggleUserStatus(currentAccountStudent.userId, newStatus);
      showSuccess(`Account ${newStatus ? 'enabled' : 'disabled'} successfully.`);
      setCurrentAccountStudent({ ...currentAccountStudent, enabled: newStatus });
      fetchStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update account status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await adminApi.resetUserPassword(currentAccountStudent.userId, newPassword);
      showSuccess('User password reset successfully.');
      setNewPassword('');
      setIsAccountModalOpen(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await studentApi.delete(deleteTarget.id);
      showSuccess(`Student ${deleteTarget.rollNumber} deleted successfully.`);
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'rollNumber',
      header: 'Roll Number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
          {row.rollNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      sortField: 'lastName',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
            {row.firstName?.[0]}
            {row.lastName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-[11px] text-slate-400">
              Enrolled: {row.enrollmentDate || 'Recent'}
            </div>
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
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.enabled !== false
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
              : 'bg-rose-50 text-rose-700 border border-rose-200/50'
          }`}
        >
          {row.enabled !== false ? (
            <>
              <CheckCircle className="w-3 h-3" /> Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" /> Suspended
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEnrollments(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Manage Course Enrollments"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenAccount(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Account Security & Access"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit Student"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Student"
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
            <GraduationCap className="w-4 h-4" /> Student Registry
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admit students, assign courses, maintain records, and manage login security.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Admit Student
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
        data={students}
        loading={loading}
        searchPlaceholder="Search students by roll number, name, or email..."
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

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={editingStudent ? 'Edit Student Profile' : 'Admit New Student'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {!editingStudent && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentFormData.rollNumber}
                onChange={(e) => setStudentFormData({ ...studentFormData, rollNumber: e.target.value })}
                placeholder="CS2026001"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentFormData.firstName}
                onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                placeholder="Jane"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentFormData.lastName}
                onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                placeholder="Doe"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {!editingStudent && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  placeholder="student@sms.com"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={studentFormData.password}
                  onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={studentFormData.departmentId}
                onChange={(e) => setStudentFormData({ ...studentFormData, departmentId: e.target.value })}
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
                Contact Phone
              </label>
              <input
                type="tel"
                value={studentFormData.phone}
                onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                placeholder="+1 555-019-1234"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
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
              {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Admit Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Course Enrollment Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Course Enrollments — ${currentStudentForEnroll?.firstName} ${currentStudentForEnroll?.lastName} (${currentStudentForEnroll?.rollNumber})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Enroll in new course form */}
          <form onSubmit={handleEnrollCourse} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Enroll in New Course
              </label>
              <select
                value={selectedCourseToEnroll}
                onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select course to enroll...</option>
                {allCourses
                  .filter(
                    (c) => !studentEnrollments.some((e) => e.courseId === c.id)
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title} ({c.credits} Credits, Sem {c.semester})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedCourseToEnroll}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap"
            >
              Enroll Student
            </button>
          </form>

          {/* Current Enrolled Courses List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Currently Registered Courses ({studentEnrollments.length})
            </h4>
            {enrollLoading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading enrollments...</p>
            ) : studentEnrollments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">This student is not yet enrolled in any courses.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {studentEnrollments.map((enr) => (
                  <div key={enr.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                          {enr.courseCode}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">{enr.courseTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Enrolled on {enr.enrollmentDate}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnenrollCourse(enr.courseId)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/60"
                      title="Unenroll student"
                    >
                      Unenroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Account Security & Access Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={`Account Controls — ${currentAccountStudent?.firstName} ${currentAccountStudent?.lastName}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          {/* Status Toggle Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Account Access</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Current status:{' '}
                <strong className={currentAccountStudent?.enabled !== false ? 'text-emerald-600' : 'text-rose-600'}>
                  {currentAccountStudent?.enabled !== false ? 'Active' : 'Suspended'}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={submitting}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentAccountStudent?.enabled !== false
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {currentAccountStudent?.enabled !== false ? 'Suspend Account' : 'Reactivate Account'}
            </button>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleResetPassword} className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-slate-800 text-sm font-bold">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Reset User Password</span>
            </div>
            <p className="text-xs text-slate-500">
              Set a temporary password. The student can use it on their next login attempt.
            </p>
            <div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                minLength={6}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting || !newPassword}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {submitting ? 'Resetting...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to permanently delete student ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.rollNumber})? Their attendance, marks, and enrollments will be wiped.`}
        confirmText="Delete Student"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ManageStudents;
