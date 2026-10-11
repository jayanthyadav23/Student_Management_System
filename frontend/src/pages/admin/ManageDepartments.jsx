import React, { useState, useEffect, useCallback } from 'react';
import { departmentApi } from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { Building2, Plus, Edit2, Trash2, Layers } from 'lucide-react';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
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
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await departmentApi.getAll({
        page,
        size,
        search: search.trim() || undefined,
        sortBy,
        sortDir,
      });

      if (res.success && res.data) {
        setDepartments(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, [page, size, search, sortBy, sortDir, showError]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showError('Please provide both department name and code.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingDept) {
        await departmentApi.update(editingDept.id, formData);
        showSuccess('Department updated successfully.');
      } else {
        await departmentApi.create(formData);
        showSuccess('Department created successfully.');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await departmentApi.delete(deleteTarget.id);
      showSuccess(`Department "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Department Name',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-slate-900">{row.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <div className="text-slate-500 max-w-xs truncate text-xs">
          {row.description || '—'}
        </div>
      ),
    },
    {
      key: 'studentCount',
      header: 'Students',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
          {row.studentCount ?? 0}
        </span>
      ),
    },
    {
      key: 'facultyCount',
      header: 'Faculty',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          {row.facultyCount ?? 0}
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
            title="Edit department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete department"
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
            <Building2 className="w-4 h-4" /> Academic Divisions
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Department Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, view, and configure academic departments and school divisions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        searchPlaceholder="Search departments by name or code..."
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
        title={editingDept ? 'Edit Department' : 'Create New Department'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Computer Science and Engineering"
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Department Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CSE"
              required
              maxLength={10}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional overview of the academic wing..."
              rows={3}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
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
              {submitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.code})? This will fail if faculty or students are assigned to it.`}
        confirmText="Delete Department"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default ManageDepartments;
