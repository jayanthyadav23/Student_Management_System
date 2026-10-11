import React, { useState, useEffect, useCallback } from 'react';
import { facultyApi } from '../../api/facultyApi';
import { departmentApi } from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { Users2, Plus, Edit2, Trash2, Mail, Building2 } from 'lucide-react';

const ManageFaculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: 'Assistant Professor',
    departmentId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchDropdownDepartments = async () => {
    try {
      const res = await departmentApi.getAllDropdown();
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch {
      // Non-critical, fallback to empty
    }
  };

  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facultyApi.getAll({
        page,
        size,
        search: search.trim() || undefined,
        departmentId: selectedDeptId || undefined,
        sortBy,
        sortDir,
      });

      if (res.success && res.data) {
        setFacultyList(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch faculty list.');
    } finally {
      setLoading(false);
    }
  }, [page, size, search, selectedDeptId, sortBy, sortDir, showError]);

  useEffect(() => {
    fetchDropdownDepartments();
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      designation: 'Assistant Professor',
      departmentId: departments.length > 0 ? departments[0].id : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      name: fac.name || '',
      email: fac.email || '',
      password: '',
      designation: fac.designation || 'Assistant Professor',
      departmentId: fac.departmentId || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.departmentId) {
      showError('Please fill in required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingFaculty) {
        await facultyApi.update(editingFaculty.id, {
          name: formData.name.trim(),
          designation: formData.designation,
          departmentId: Number(formData.departmentId),
        });
        showSuccess('Faculty profile updated successfully.');
      } else {
        if (!formData.email?.trim() || !formData.password) {
          showError('Email and initial password are required for new faculty.');
          setSubmitting(false);
          return;
        }
        await facultyApi.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          designation: formData.designation,
          departmentId: Number(formData.departmentId),
        });
        showSuccess('Faculty member onboarded successfully.');
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save faculty record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await facultyApi.delete(deleteTarget.id);
      showSuccess(`Faculty member deleted successfully.`);
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete faculty member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Faculty Name',
      sortable: true,
      sortField: 'name',
      render: (row) => {
        const initials = row.name
          ? row.name.split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase()
          : 'FC';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {row.name}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {row.designation}
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
          <span className="text-slate-400 font-mono text-[10px]">({row.departmentCode})</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / Account',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'assignedCoursesCount',
      header: 'Assigned Courses',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          {row.assignedCoursesCount ?? 0} {row.assignedCoursesCount === 1 ? 'Course' : 'Courses'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit faculty"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete faculty"
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
            <Users2 className="w-4 h-4" /> Teaching Staff
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Faculty Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic instructors, department mappings, and teaching assignments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Onboard Faculty
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
        data={facultyList}
        loading={loading}
        searchPlaceholder="Search faculty by name, email, or designation..."
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
        title={editingFaculty ? 'Edit Faculty Profile' : 'Onboard New Faculty Member'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Alan Turing"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {!editingFaculty && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="faculty@sms.com"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Designation <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Visiting Faculty">Visiting Faculty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
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
              {submitting ? 'Saving...' : editingFaculty ? 'Update Profile' : 'Onboard Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to remove ${deleteTarget?.name}? Their user account and assignments will be deleted.`}
        confirmText="Delete Faculty"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ManageFaculty;
