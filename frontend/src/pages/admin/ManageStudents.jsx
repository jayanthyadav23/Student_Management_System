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
  Eye,
  Download,
  Upload,
  Calendar,
  UserCheck,
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
    academicYear: '2024-2025',
  });

  // Student Profile View Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [profileEnrollments, setProfileEnrollments] = useState([]);
  const [loadingProfileEnrollments, setLoadingProfileEnrollments] = useState(false);

  // Course Enrollment Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [currentStudentForEnroll, setCurrentStudentForEnroll] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [importing, setImporting] = useState(false);

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
      academicYear: '2024-2025',
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
      academicYear: student.academicYear || '2024-2025',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenProfile = async (student) => {
    setViewingStudent(student);
    setIsProfileModalOpen(true);
    try {
      setLoadingProfileEnrollments(true);
      const res = await studentApi.getEnrollments(student.id);
      if (res.success && res.data) {
        setProfileEnrollments(res.data);
      }
    } catch {
      setProfileEnrollments([]);
    } finally {
      setLoadingProfileEnrollments(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      await studentApi.toggleStatus(student.id);
      showSuccess(`Status updated for ${student.rollNumber}`);
      fetchStudents();
    } catch (err) {
      showError('Failed to toggle student status.');
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingStudent) {
        await studentApi.update(editingStudent.id, {
          firstName: studentFormData.firstName.trim(),
          lastName: studentFormData.lastName.trim(),
          phone: studentFormData.phone?.trim(),
          academicYear: studentFormData.academicYear?.trim(),
          departmentId: Number(studentFormData.departmentId),
        });
        showSuccess('Student record updated.');
      } else {
        await studentApi.create({
          rollNumber: studentFormData.rollNumber.trim().toUpperCase(),
          firstName: studentFormData.firstName.trim(),
          lastName: studentFormData.lastName.trim(),
          email: studentFormData.email.trim(),
          password: studentFormData.password,
          phone: studentFormData.phone?.trim(),
          academicYear: studentFormData.academicYear?.trim(),
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

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const res = await studentApi.getAllList();
      const list = res.success && res.data ? res.data : students;
      const headers = ['Roll Number', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Academic Year', 'Status'];
      const rows = list.map((s) => [
        `"${s.rollNumber || ''}"`,
        `"${s.firstName || ''}"`,
        `"${s.lastName || ''}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.departmentName || ''}"`,
        `"${s.academicYear || ''}"`,
        `"${s.status || (s.enabled !== false ? 'ACTIVE' : 'INACTIVE')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess('Student registry exported to CSV.');
    } catch {
      showError('Failed to export students.');
    }
  };

  // CSV Import
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    try {
      setImporting(true);
      const lines = csvRawText.trim().split('\n');
      let createdCount = 0;
      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 4 && parts[0].toLowerCase() !== 'roll number') {
          try {
            await studentApi.create({
              rollNumber: parts[0].toUpperCase(),
              firstName: parts[1],
              lastName: parts[2] || '',
              email: parts[3],
              password: parts[4] || 'Student@123',
              phone: parts[5] || '',
              departmentId: departments[0]?.id || 1,
              academicYear: parts[6] || '2024-2025',
            });
            createdCount++;
          } catch {
            // Continue with others
          }
        }
      }
      showSuccess(`Imported ${createdCount} student profile(s).`);
      setIsImportModalOpen(false);
      setCsvRawText('');
      fetchStudents();
    } catch (err) {
      showError('Failed to import CSV data.');
    } finally {
      setImporting(false);
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
              Year: {row.academicYear || '2024-2025'}
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
      render: (row) => {
        const isActive = row.status !== 'INACTIVE' && row.enabled !== false;
        return (
          <button
            onClick={() => handleToggleStatus(row)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
            title="Click to toggle status"
          >
            {isActive ? (
              <>
                <CheckCircle className="w-3 h-3" /> Active
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" /> Inactive
              </>
            )}
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenProfile(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Student Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
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
            title="Account Security & Password"
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
            Admit students, profile records, enroll courses, import/export CSV, and manage credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Import CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Admit Student
          </button>
        </div>
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

      {/* Student Profile View Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Student Profile Overview"
        maxWidth="max-w-2xl"
      >
        {viewingStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl">
                {viewingStudent.firstName?.[0]}
                {viewingStudent.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingStudent.firstName} {viewingStudent.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white text-indigo-700 rounded border border-indigo-200">
                    {viewingStudent.rollNumber}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {viewingStudent.departmentName}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block">Academic Year</span>
                <span className="text-slate-800 font-bold mt-1 block">
                  {viewingStudent.academicYear || '2024-2025'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block">Email</span>
                <span className="text-slate-800 font-bold mt-1 block truncate">
                  {viewingStudent.email}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block">Phone</span>
                <span className="text-slate-800 font-bold mt-1 block">
                  {viewingStudent.phone || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Enrolled Courses ({profileEnrollments.length})
              </h4>
              {loadingProfileEnrollments ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading courses...</div>
              ) : profileEnrollments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Not enrolled in any courses currently.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {profileEnrollments.map((e) => (
                    <div
                      key={e.courseId}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {e.courseCode}
                        </span>
                        <span className="font-semibold text-slate-800">{e.courseTitle}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{e.credits} Credits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Students via CSV"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleImportCSV} className="space-y-4">
          <p className="text-xs text-slate-500">
            Paste comma-separated student records below. Format: <br />
            <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded">
              RollNumber, FirstName, LastName, Email, InitialPassword, Phone, AcademicYear
            </code>
          </p>
          <textarea
            rows={6}
            value={csvRawText}
            onChange={(e) => setCsvRawText(e.target.value)}
            placeholder="CS202610, Alice, Smith, alice@sms.com, Pass@123, +15550190, 2024-2025&#10;CS202611, Bob, Jones, bob@sms.com, Pass@123, +15550191, 2024-2025"
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-60"
            >
              {importing ? 'Importing...' : 'Import Students'}
            </button>
          </div>
        </form>
      </Modal>

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
                Academic Year
              </label>
              <input
                type="text"
                value={studentFormData.academicYear}
                onChange={(e) => setStudentFormData({ ...studentFormData, academicYear: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
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
        title={`Course Enrollment - ${currentStudentForEnroll?.rollNumber || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <form onSubmit={handleEnrollCourse} className="flex gap-2">
            <select
              value={selectedCourseToEnroll}
              onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">Select course to enroll student...</option>
              {allCourses
                .filter((c) => !studentEnrollments.some((e) => e.courseId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title} ({c.credits} Credits)
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!selectedCourseToEnroll || submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              Enroll
            </button>
          </form>

          {enrollLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading courses...</div>
          ) : studentEnrollments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Student is not currently enrolled in any courses.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {studentEnrollments.map((e) => (
                <div
                  key={e.courseId}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-indigo-600">{e.courseCode}</span>
                    <span className="ml-2 font-semibold text-slate-800">{e.courseTitle}</span>
                  </div>
                  <button
                    onClick={() => handleUnenrollCourse(e.courseId)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50"
                    title="Unenroll"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Account Security Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Student Account Security"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-500">
            Reset login credentials for{' '}
            <strong className="text-slate-800">{currentAccountStudent?.email}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              Reset Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student Profile"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.rollNumber})? This will safely clean attendance records and enrollments.`}
        confirmText="Delete Student"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ManageStudents;
