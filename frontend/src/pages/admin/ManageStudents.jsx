import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../../api/studentApi';
import { departmentApi } from '../../api/departmentApi';
import { courseApi } from '../../api/courseApi';
import { adminApi } from '../../api/adminApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
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
  Lock,
} from 'lucide-react';

const ManageStudents = () => {
  const { user } = useAuth();
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
    name: '',
    email: '',
    password: '',
    age: 20,
    semester: 1,
    phone: '',
    departmentId: '',
    academicYear: '2024-2025',
    address: '',
    status: 'ACTIVE',
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
      name: '',
      email: '',
      password: '',
      age: 20,
      semester: 1,
      phone: '',
      departmentId: departments.length > 0 ? departments[0].id : '',
      academicYear: '2024-2025',
      address: '',
      status: 'ACTIVE',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setStudentFormData({
      rollNumber: student.rollNumber || '',
      name: student.name || '',
      email: student.email || '',
      password: '',
      age: student.age || 20,
      semester: student.semester || 1,
      phone: student.phone || '',
      departmentId: student.departmentId || (departments[0]?.id || ''),
      academicYear: student.academicYear || '2024-2025',
      address: student.address || '',
      status: student.status || 'ACTIVE',
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
    if (!studentFormData.name?.trim()) {
      showError('Student name is required.');
      return;
    }
    if (!studentFormData.departmentId) {
      showError('Please select a department.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStudent) {
        await studentApi.update(editingStudent.id, {
          rollNumber: (studentFormData.rollNumber || editingStudent.rollNumber).trim().toUpperCase(),
          name: studentFormData.name.trim(),
          age: Number(studentFormData.age) || 20,
          departmentId: Number(studentFormData.departmentId),
          semester: Number(studentFormData.semester) || 1,
          phone: studentFormData.phone?.trim() || '',
          academicYear: studentFormData.academicYear?.trim() || '2024-2025',
          address: studentFormData.address?.trim() || '',
          status: studentFormData.status || 'ACTIVE',
        });
        showSuccess('Student profile updated successfully.');
      } else {
        if (!studentFormData.rollNumber?.trim()) {
          showError('Roll number is required.');
          setSubmitting(false);
          return;
        }
        if (!studentFormData.email?.trim() || !studentFormData.password) {
          showError('Email and initial password are required.');
          setSubmitting(false);
          return;
        }
        await studentApi.create({
          rollNumber: studentFormData.rollNumber.trim().toUpperCase(),
          name: studentFormData.name.trim(),
          email: studentFormData.email.trim(),
          password: studentFormData.password,
          age: Number(studentFormData.age) || 20,
          departmentId: Number(studentFormData.departmentId),
          semester: Number(studentFormData.semester) || 1,
          phone: studentFormData.phone?.trim() || '',
          academicYear: studentFormData.academicYear?.trim() || '2024-2025',
          address: studentFormData.address?.trim() || '',
          status: studentFormData.status || 'ACTIVE',
        });
        showSuccess('Student admitted and account created successfully.');
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
      const headers = ['Roll Number', 'Student Name', 'Email', 'Phone', 'Department', 'Semester', 'Academic Year', 'Status'];
      const rows = list.map((s) => [
        `"${s.rollNumber || ''}"`,
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.departmentName || ''}"`,
        `"${s.semester ?? 1}"`,
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
        if (parts.length >= 3 && parts[0].toLowerCase() !== 'roll number') {
          try {
            await studentApi.create({
              rollNumber: parts[0].toUpperCase(),
              name: parts[1],
              email: parts[2],
              password: parts[3] || 'Student@123',
              age: 20,
              semester: 1,
              phone: parts[4] || '',
              departmentId: departments[0]?.id || 1,
              academicYear: parts[5] || '2024-2025',
              status: 'ACTIVE',
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
      sortField: 'name',
      render: (row) => {
        const initials = row.name
          ? row.name.split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase()
          : 'ST';
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {row.name}
              </div>
              <div className="text-[11px] text-slate-400">
                Sem {row.semester ?? 1} • Age {row.age ?? '—'} • {row.academicYear || '2024-2025'}
              </div>
            </div>
          </div>
        );
      },
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
        {user?.role === 'FACULTY' ? (
          <div className="px-3.5 py-2 text-sm bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-semibold flex items-center gap-1.5 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Department: {students[0]?.departmentName || 'Your Department'}</span>
          </div>
        ) : (
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
        )}
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
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl uppercase">
                {viewingStudent.name ? viewingStudent.name.split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingStudent.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white text-indigo-700 rounded border border-indigo-200">
                    {viewingStudent.rollNumber}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {viewingStudent.departmentName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                    Semester {viewingStudent.semester ?? 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${viewingStudent.status === 'ACTIVE' || viewingStudent.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {viewingStudent.status || (viewingStudent.enabled !== false ? 'ACTIVE' : 'INACTIVE')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block">Academic Year</span>
                <span className="text-slate-800 font-bold mt-1 block">
                  {viewingStudent.academicYear || '2024-2025'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-semibold block">Age</span>
                <span className="text-slate-800 font-bold mt-1 block">
                  {viewingStudent.age ? `${viewingStudent.age} Years` : '—'}
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

            {viewingStudent.address && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs">
                <span className="text-slate-400 font-semibold block">Campus / Home Address</span>
                <span className="text-slate-800 font-medium mt-1 block">
                  {viewingStudent.address}
                </span>
              </div>
            )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                disabled={!!editingStudent}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono disabled:opacity-60 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentFormData.name}
                onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                placeholder="Ada Lovelace"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {!editingStudent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={studentFormData.semester}
                onChange={(e) => setStudentFormData({ ...studentFormData, semester: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={studentFormData.age}
                onChange={(e) => setStudentFormData({ ...studentFormData, age: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Status
              </label>
              <select
                value={studentFormData.status}
                onChange={(e) => setStudentFormData({ ...studentFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={studentFormData.address}
              onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
              placeholder="e.g. 42 Innovation Way, Tech Campus"
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
